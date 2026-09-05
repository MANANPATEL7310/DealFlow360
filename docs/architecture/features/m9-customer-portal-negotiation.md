# M9 — Customer Portal & Live Negotiation ★

## 1. Feature Overview

- **Feature Name**: M9 — Customer Portal & Live Negotiation (The Customer Boundary & Governance Gate)
- **Purpose**: Provides a dedicated, secure, external customer interaction surface for DealFlow360 quotations. Customers access their specific quotation using stateless, signed magic links (`PORTAL_JWT_SECRET`) without requiring internal system accounts. Customers can review quotation items (with internal cost and profit margins strictly stripped via safe read projection), submit order-level or line-item negotiation requests (comments and counter-discount percentages), and confirm the quotation. When the customer confirms, the server folds rep-accepted counter-offers into line discounts, recomputes financial totals, and runs the M4 blended risk engine. If the revised terms exceed discount governance thresholds, the quotation is automatically escalated to `PENDING_APPROVAL` with newly generated `ApprovalStep`s, ensuring that a customer cannot self-approve an overage.
- **Triggering User Actions**:
  - Internal Sales Rep sends quotation to customer: `POST /api/v1/quotations/:id/send`
  - Internal Sales Rep views negotiation requests: `GET /api/v1/quotations/:id/negotiations`
  - Internal Sales Rep answers/accepts negotiation request: `POST /api/v1/quotations/:id/negotiations/:negId/answer`
  - Customer opens magic link in portal: `POST /api/v1/portal/open`
  - Customer views quotation summary: `GET /api/v1/portal/quotation`
  - Customer submits negotiation counter-offer: `POST /api/v1/portal/negotiations`
  - Customer confirms quotation: `POST /api/v1/portal/confirm`
- **Expected Outcome**: Secure customer portal access, real-time negotiation request tracking, safe read projection preventing data leaks, and server-authoritative governance gating that routes to either `CONFIRMED` or `PENDING_APPROVAL`.

---

## 2. User Flow

```
Sales Rep                    Customer Portal                  Governance & DB
   │                               │                                │
   │── POST /quotations/:id/send ─►│                                │
   │   (Verify APPROVED status,    │                                │
   │    validate customer contact, │                                │
   │    mint portal JWT, SENT)     │                                │
   │◄── { token, url } ────────────│                                │
   │                               │                                │
   │                               │── POST /portal/open ──────────►│
   │                               │   (Verify portal JWT,          │
   │                               │    SENT ➔ UNDER_NEGOTIATION)   │
   │                               │◄── Safe Quotation Projection ──│
   │                               │                                │
   │                               │── POST /portal/negotiations ──►│
   │                               │   (Submit comment/counter %)   │
   │                               │◄── NegotiationRequest (OPEN) ──│
   │                               │                                │
   │── GET /quotations/:id/negs ──►│                                │
   │── POST .../:negId/answer ────►│ (Rep marks ACCEPTED)           │
   │                               │                                │
   │                               │── POST /portal/confirm ───────►│
   │                               │                                │ 1. Fold ACCEPTED counters
   │                               │                                │ 2. Recompute totals
   │                               │                                │ 3. Recompute M4 blended risk
   │                               │                                │
   │                               │◄── CONFIRMED (if risk ok) ─────│ (Levels == 0)
   │                               │   OR                           │
   │                               │◄── PENDING_APPROVAL ───────────│ (Levels > 0, steps created)
```

1. **Send to Customer**: Sales Rep triggers `sendToCustomer`. System validates that quotation is in `APPROVED` status and that the target contact belongs to the customer. Transitions quotation status from `APPROVED` ➔ `SENT` and mints a portal JWT.
2. **Customer Access & Portal Open**: Customer opens the magic link URL (`/portal?token=...`). Portal calls `POST /api/v1/portal/open`. Server authenticates the portal token, idempotently transitions the quote from `SENT` ➔ `UNDER_NEGOTIATION`, and returns the safe read projection.
3. **Negotiation Request**: Customer submits comments or counter discount percentages targeting a line item or order-level. Creates a `NegotiationRequest` in `OPEN` status.
4. **Rep Review & Answer**: Sales rep reviews open negotiations and answers with `ANSWERED` (declined/informational) or `ACCEPTED` (conceded discount). Only `ACCEPTED` requests affect pricing.
5. **The Governance Gate (Confirm)**: Customer clicks confirm in portal. Inside a database transaction:
   - All `ACCEPTED` requests fold their `counterDiscountPct` into quotation lines.
   - Quotation subtotal, discounts, taxes, and grand totals are recomputed.
   - The M4 Blended Risk Engine evaluates the revised terms.
   - If required approver levels > 0: transitions quote to `PENDING_APPROVAL`, creates sequential `ApprovalStep` records, records audit log `portal.confirm.escalated`, and returns required levels.
   - If required approver levels == 0: transitions quote to `CONFIRMED`, triggers `onConfirmed()` lifecycle hook (for M7/M8), records audit log `portal.confirm.confirmed`, and returns status `CONFIRMED`.

---

## 3. Related File Structure

### Shared Contracts

- `packages/shared/src/schemas/portal.ts` — Zod schemas (`sendQuotationSchema`, `submitNegotiationSchema`, `answerNegotiationSchema`) and types.
- `packages/shared/src/config/api-routes.ts` — Central route registry declaring internal rep actions under `quotations` and customer endpoints under `portal`.
- `packages/shared/src/config/routes.ts` — Web route configuration including standalone public portal route (`portal: "/portal"`).

### Customer Portal Module

- `apps/api/src/modules/portal/portal.token.ts` — Dedicated token minting and verification (`mintPortalToken`, `verifyPortalToken`) using `PORTAL_JWT_SECRET` and audience `dealflow-portal`.
- `apps/api/src/middleware/require-portal-auth.ts` — Express authentication middleware validating customer tokens and populating `req.portal = { quotationId, contactId }`.
- `apps/api/src/modules/portal/portal.service.ts` — Safe read projection (`scopedSummary`), portal open (`openPortal`), negotiation submission (`submitNegotiation`), and the transactional governance gate (`portalConfirm`).
- `apps/api/src/modules/portal/portal.controller.ts` — HTTP controllers for `/api/v1/portal/*` endpoints.
- `apps/api/src/modules/portal/portal.routes.ts` — Express router mounting portal endpoints with `requirePortalAuth`.
- `apps/api/src/modules/portal/portal.test.ts` — Vitest suite verifying token isolation, projection data stripping, lifecycle transitions, and governance gate logic.

### Quotation Domain Integrations

- `apps/api/src/modules/quotation/send.service.ts` — Rep workflow services: `sendToCustomer`, `listNegotiations`, `answerNegotiation`.
- `apps/api/src/modules/quotation/lifecycle.ts` — State machine transition guards and status event logging supporting customer actors (`actorKind: "customer"`).
- `apps/api/src/modules/quotation/confirmed.hook.ts` — Lifecycle hook invoked when a quotation is confirmed.
- `apps/api/src/modules/quotation/quotation.service.ts` — Transactional `loadQuotationWithLines` and `recomputeTotals` supporting transaction clients.
- `apps/api/src/modules/quotation/quotation.controller.ts` & `quotation.routes.ts` — Rep endpoints for send and negotiation review.

---

## 4. Data Flow

```
[Customer Browser]
       │
       ▼ (Bearer <portalToken>)
[requirePortalAuth Middleware]
       │ (Claims: quotationId, contactId)
       ▼
[portalRouter (/api/v1/portal)]
       │
       ▼
[portal.service.ts]
       ├── scopedSummary() ────────► Returns sanitized JSON (no costs / margins)
       ├── submitNegotiation() ───► Inserts NegotiationRequest (status: OPEN)
       └── portalConfirm() ───────► db.$transaction:
                                      ├── tx.quotationLine.update (apply accepted counters)
                                      ├── recomputeTotals(tx)
                                      ├── computeBlendedRisk() & resolveRequiredLevels()
                                      └── Branch:
                                          ├── Levels > 0 ➔ tx.quotation.update(PENDING_APPROVAL)
                                          │               tx.approvalStep.create(...)
                                          └── Levels == 0 ➔ tx.quotation.update(CONFIRMED)
                                                           onConfirmed(tx)
```

---

## 5. Database Schema & Models

### `NegotiationRequest`

```prisma
enum NegotiationStatus {
  OPEN
  ANSWERED
  ACCEPTED
}

model NegotiationRequest {
  id                 String            @id @default(cuid())
  quotationId        String
  quotation          Quotation         @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  contactId          String
  contact            CustomerContact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  lineId             String?           // null = order-level request, otherwise QuotationLine ID
  comment            String?
  counterDiscountPct Float?
  status             NegotiationStatus @default(OPEN)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  @@index([quotationId, status])
  @@index([contactId])
}
```

### Relations on Quotation & CustomerContact

```prisma
model Quotation {
  // ...
  negotiations NegotiationRequest[]
}

model CustomerContact {
  // ...
  negotiationRequests NegotiationRequest[]
}
```

---

## 6. API Endpoints & Route Definitions

### Customer Portal Routes (`/api/v1/portal`)

All portal endpoints authenticate via `requirePortalAuth` and extract `{ quotationId, contactId }` from token claims. There are **no `:id` route parameters**.

| Method | Path                          | Auth         | Description                                                                         |
| ------ | ----------------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/portal/quotation`    | Portal Token | Returns safe projection of quotation                                                |
| `POST` | `/api/v1/portal/open`         | Portal Token | Idempotently transitions `SENT` ➔ `UNDER_NEGOTIATION`                               |
| `POST` | `/api/v1/portal/negotiations` | Portal Token | Customer submits a comment or counter-discount ask                                  |
| `POST` | `/api/v1/portal/confirm`      | Portal Token | Folds accepted counters, evaluates risk, gates to `CONFIRMED` or `PENDING_APPROVAL` |

### Internal Sales Rep Negotiation Routes (`/api/v1/quotations`)

All rep routes authenticate via `requireAuth`.

| Method | Path                                                | Auth          | Description                                                         |
| ------ | --------------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| `POST` | `/api/v1/quotations/:id/send`                       | Bearer (User) | Sends approved quotation to customer contact and returns magic link |
| `GET`  | `/api/v1/quotations/:id/negotiations`               | Bearer (User) | Lists all customer negotiation requests on the quotation            |
| `POST` | `/api/v1/quotations/:id/negotiations/:negId/answer` | Bearer (User) | Rep answers (`ANSWERED`) or accepts (`ACCEPTED`) a negotiation ask  |

---

## 7. Authentication & Authorization Scoping Doctrine

The Customer Portal operates under strict cryptographic and architectural isolation:

1. **No Route ID Parameters**: Portal endpoints NEVER take `:id` or query parameters to designate a quotation. The quotation ID and customer contact ID are extracted solely from the cryptographically verified JWT claims (`req.portal.quotationId`, `req.portal.contactId`). A customer cannot manipulate IDs to access other quotes.
2. **Distinct Secret & Audience**:
   - Internal Auth: Signed with `env.JWT_SECRET`, audience default / internal.
   - Portal Auth: Signed with `env.PORTAL_JWT_SECRET`, audience `dealflow-portal`.
   - Cross-token rejection: Internal user tokens are rejected by `requirePortalAuth` (mismatched audience/secret); portal tokens are rejected by internal `requireAuth`.
3. **No Internal User Representation**: Portal visitors have no `User` record or system role. Audit logs attribute actions to `actorKind: "customer"` and `actorId: contactId`.
4. **Time-To-Live Expiration**: Tokens expire according to `env.PORTAL_TOKEN_TTL` (default `14d`). Expired tokens return `401 PORTAL_TOKEN_EXPIRED`.

---

## 8. The Governance Gate & Risk Re-Evaluation (M4 Integration)

A core vulnerability in commercial negotiation is allowing customer counter-offers to bypass pricing governance. DealFlow360 guarantees safety via the Governance Gate in `portalConfirm`:

```typescript
// 1) Fold accepted counter offers into quotation lines
await applyAcceptedCounters(tx, q);
q = await loadQuotationWithLines(quotationId, { prisma: tx });

// 2) Re-evaluate risk using M4 blended risk engine
const cfg = await loadRiskConfig(q.customer.tier);
const risk = computeBlendedRisk(q.lines.map(toRiskLine), cfg);
const chain = await tx.approvalChainRule.findMany({
  orderBy: { minScore: "asc" },
});
const levels = resolveRequiredLevels(risk, cfg, chain);

// 3) Governance Gate
if (levels.length > 0) {
  // Escalated: customer cannot self-approve overage
  await tx.quotation.update({
    where: { id: q.id },
    data: { status: "PENDING_APPROVAL", blendedRiskScore: risk.blendedScore },
  });
  await createApprovalSteps(tx, q.id, levels);
  return { status: "PENDING_APPROVAL", requiredLevels: levels, risk };
}

// Approved: within thresholds
await tx.quotation.update({
  where: { id: q.id },
  data: { status: "CONFIRMED", blendedRiskScore: risk.blendedScore },
});
await onConfirmed(q.id, tx);
return { status: "CONFIRMED", risk };
```

Why recompute risk rather than trusting individual accepted counters?
An individual counter-discount on one line may look acceptable in isolation, but when combined with discounts across other categories or large volumes, the blended risk score or order value may cross approval thresholds. Re-running M4 on the folded terms ensures total governance consistency.

---

## 9. Business Rules & Edge Cases

| Scenario                                                       | Handled Behavior                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Customer opens link multiple times                             | Idempotent: transitions `SENT` ➔ `UNDER_NEGOTIATION` on first open; remains `UNDER_NEGOTIATION` on subsequent opens. |
| Customer tries to access portal when quote is `DRAFT`          | Rep cannot send a `DRAFT` quote (requires `APPROVED`). Attempting to forge a token will fail HMAC verification.      |
| Customer submits counter on non-existent line item             | Validation rejects with `422 LINE_NOT_ON_QUOTE`.                                                                     |
| Customer submits request with neither comment nor discount     | Zod schema refinement rejects with `400 Validation error`.                                                           |
| Multiple accepted counters for the same line                   | Sorted by `createdAt ASC`; later accepted counter deterministic overwrite.                                           |
| Order-level counter offer (`lineId: null`)                     | Applied across all quotation lines in `applyAcceptedCounters`.                                                       |
| Customer confirms after rep answered but declined (`ANSWERED`) | `ANSWERED` requests are ignored during fold; original line discount remains intact.                                  |
| Token presented is expired                                     | Returns `401` with error code `PORTAL_TOKEN_EXPIRED`.                                                                |

---

## 10. Audit Trail & Status History

Every portal action and rep negotiation decision is recorded in `QuotationStatusEvent` and `AuditLog`:

1. `quotation.sent_to_customer`: Recorded with actorKind `user`, actorId `rep.id`, and diff containing `contactId` and magic link URL.
2. `quotation.under_negotiation`: Recorded when customer opens link, with actorKind `customer` and actorId `contactId`.
3. `negotiation.submitted`: Recorded when customer submits comment/counter, entity `NegotiationRequest`.
4. `negotiation.accepted` / `negotiation.answered`: Recorded when sales rep decides on a counter-offer.
5. `portal.confirm.escalated`: Recorded when folded discounts exceed limits, capturing `blendedScore` and `requiredLevels`.
6. `portal.confirm.confirmed`: Recorded when quote is successfully confirmed within bounds.

---

## 11. Security Model & Defense-in-Depth

| Threat                                       | Defense-in-Depth Mechanism                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tampering with quotation ID in URL           | Portal routes have no `:id` in URL or body. All queries filter by verified `req.portal.quotationId`.                                                   |
| Infiltrating internal API with portal token  | Internal routes use `requireAuth` with `env.JWT_SECRET`; rejects portal token signature and audience.                                                  |
| Accessing portal with internal user token    | Portal routes use `requirePortalAuth` with `env.PORTAL_JWT_SECRET` and audience `dealflow-portal`; rejects user JWT.                                   |
| Data leakage of profit margins or costs      | `scopedSummary()` uses an explicit allow-list projection omitting `unitCostMinor`, `marginPct`, risk breakdowns, approval history, and internal notes. |
| Customer self-approving deep discounts       | `portalConfirm` re-evaluates risk in a DB transaction; if levels > 0, enforces `PENDING_APPROVAL`.                                                     |
| Stolen or leaked magic link after deal close | Tokens expire via `PORTAL_TOKEN_TTL`, and confirmed quotes cannot accept new negotiations.                                                             |

---

## 12. Error Handling & Status Codes

| Error Code                | HTTP Status | Trigger Condition                                                              |
| ------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `PORTAL_UNAUTHORIZED`     | 401         | Missing token, signature mismatch, or invalid audience.                        |
| `PORTAL_TOKEN_EXPIRED`    | 401         | Portal token JWT expired past `PORTAL_TOKEN_TTL`.                              |
| `NOT_APPROVED`            | 409         | Rep attempted `sendToCustomer` on quotation that is not in `APPROVED` status.  |
| `CONTACT_NOT_ON_CUSTOMER` | 422         | Target contact ID does not belong to the quotation customer.                   |
| `NOT_NEGOTIATING`         | 409         | Attempting portal submit or confirm when quotation is not `UNDER_NEGOTIATION`. |
| `LINE_NOT_ON_QUOTE`       | 422         | Counter-offer submitted for a `lineId` that does not exist on the quotation.   |
| `NEGOTIATION_NOT_FOUND`   | 404         | Rep attempted to answer a negotiation request not belonging to the quotation.  |
| `ILLEGAL_TRANSITION`      | 409         | Lifecycle transition guard rejected state movement.                            |

---

## 13. Test Coverage & Verification

Automated Vitest suite in `apps/api/src/modules/portal/portal.test.ts` covers:

- [x] Portal JWT minting and verification with correct claims and audience.
- [x] Cross-token defense: rejection of tokens signed with internal `JWT_SECRET`.
- [x] Rejection of tokens with mismatched audience.
- [x] Rejection of expired portal tokens.
- [x] Safe projection: validation that `unitCostMinor` and `marginPct` are completely omitted.
- [x] Lifecycle state transitions (`APPROVED` ➔ `SENT` ➔ `UNDER_NEGOTIATION` ➔ `CONFIRMED` / `PENDING_APPROVAL`).
- [x] Rejection of invalid transitions (e.g. `SENT` ➔ `PENDING_APPROVAL`).
- [x] Validation schemas for send, submit negotiation, and answer negotiation.

Verification command:

```bash
pnpm --filter @template/api test
```

Result: 24 tests passing across 3 test suites.

---

## 14. Future Integrations (Handoffs to M7 & M8)

The completion of M9 establishes the foundation for downstream milestone handoffs:

1. **M7 — Warehouse Fulfillment Split Optimizer**:
   - Downstream trigger: In `onConfirmed(quotationId, tx)`, once quotation status transitions to `CONFIRMED`, M7 hooks in to evaluate warehouse stock and generate split fulfillment orders.
2. **M8 — Hybrid Billing & Proration Engine**:
   - Downstream trigger: In `onConfirmed(quotationId, tx)`, M8 hooks in to generate the billing schedule (one-off line items, recurring milestone charges, and deposit invoice records).
