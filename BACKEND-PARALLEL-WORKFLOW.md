<!-- .planning/core-platform/BACKEND-PARALLEL-WORKFLOW.md -->

# Backend Parallel Workflow — 3 Developers

> Core-platform backend only (M0–M12). Agentic AI (Phase 2) is excluded — that comes after Phase 1
> is stable. This document splits all backend work across **3 developers** with clear ownership,
> handoff points, and sprint-by-sprint timelines.

## The constraint: M5 is the bottleneck

Everything fans out from the **Quotation Builder** (M5). M5 needs M1 (products), M2 (customers),
M3 (discount config), and M4 (risk engine) before it can function. Everything after M5 — upsell,
fulfillment, billing, portal, deal health, reporting — attaches to the quotation lifecycle. So the
strategy is: **get M5 done as fast as possible, then fan out.**

```
                Sprint 1                    Sprint 2                   Sprint 3
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
Dev 1       │ M0 Foundation │──►       │ M4 Risk Engine│──►       │ M9 Portal     │
(Spine)     │ M3 Discount   │          │ M5 Quotation ★│          │               │
            └───────────────┘          └───────┬───────┘          └───────────────┘
                                               │
            ┌───────────────┐          ┌───────▼───────┐          ┌───────────────┐
Dev 2       │ M1 Products   │──►       │ M6 Upsell     │──►       │ M8 Billing    │
(Commerce)  │ M2 Customers  │          │               │          │               │
            └───────────────┘          └───────────────┘          └───────────────┘
                                               │
            ┌───────────────┐          ┌───────▼───────┐          ┌───────────────┐
Dev 3       │ M7 data model │──►       │ M7 backend    │──►       │ M11 Reporting │
(Ops)       │ + optimizer   │          │ M10 DealHealth│          │ M12 Admin     │
            └───────────────┘          └───────────────┘          └───────────────┘
```

---

## Developer 1 — "The Spine" (Critical Path Owner)

**Owns:** M0 → M3 → M4 → M5 → M9

This developer is the **critical path**. Their M5 unblocks everyone else. They should be the most
experienced backend developer on the team.

### Sprint 1

#### M0 — Foundation & Auth

- **Files:** `00-foundation-auth/01-data-model.md` through `06-seed.md`
- **Tasks:**
  - [ ] Add `SystemSetting` + `AuditLog` models to `prisma/schema.prisma`
  - [ ] Widen `User.role` to accept `sales_rep | sales_manager | finance | admin`
  - [ ] Implement bcrypt register/login/me + JWT session (`02-auth.md`)
  - [ ] Build `requireAuth` + `requireRole` middleware (`03-rbac-middleware.md`)
  - [ ] Create `validateRequest` envelope, `money.ts`, `margin.ts`, `audit.ts` (`04-validation-and-helpers.md`)
  - [ ] Set up `env.ts` with Zod validation (`05-env-config.md`)
  - [ ] Write `prisma/seed.ts` with users + system settings (`06-seed.md`)
  - [ ] Run `pnpm db:push && pnpm db:seed` — verify login works for all 4 roles
- **Handoff:** Merge to `main`. All devs pull. Everyone now has auth, audit, money helpers.

#### M3 — Discount Governance Config

- **Files:** `03-discount-governance-config/01-data-model.md` through `02-backend.md`
- **Tasks:**
  - [ ] Add `DiscountTier`, `CategoryCeiling`, `ApprovalChainRule` models to schema
  - [ ] Build admin-only CRUD: `governance.service.ts`, `governance.controller.ts`, `governance.routes.ts`
  - [ ] Add `writeAudit` calls on every governance mutation (see `12-audit-admin-config/01-audit-trail.md`)
  - [ ] Update seed with tier/ceiling/rule data
  - [ ] Mount at `/api/v1/governance`
- **Handoff:** Merge. M4 can now read these tables.

### Sprint 2

#### M4 — Blended Risk Engine ★

- **Files:** `04-blended-risk-engine/01-risk-engine.md` through `03-tests.md`
- **Tasks:**
  - [ ] Implement `computeBlendedRisk(lines, cfg)` — pure function, no DB
  - [ ] Implement `resolveRequiredLevels(risk, cfg, chainRules)` — routing decision
  - [ ] Build `loadRiskConfig(customerTier)` — loads from M3 tables + `SystemSetting`
  - [ ] Create `evaluateQuoteRisk(tier, lines)` facade for M5 to call
  - [ ] Write `risk-engine.test.ts` — all-within, one big overage, many small overages, value trigger
  - [ ] Tests must be green before moving to M5

#### M5 — Quotation Builder & Lifecycle ★ (the spine)

- **Files:** `05-quotation-builder-lifecycle/01-data-model.md` through `05-tests.md`
- **Blocked by:** Dev 2's M1 (`resolveUnitPrice`) and M2 (customer tier) — coordinate timing
- **Tasks:**
  - [ ] Add `Quotation`, `QuotationLine`, `StatusEvent`, `ApprovalStep` models + enums to schema
  - [ ] Implement lifecycle state machine: `ALLOWED` transition map + `assertTransition` (`02-lifecycle.md`)
  - [ ] Build `addLine` / `updateLine` / `deleteLine` + `recomputeTotals` (`03-confirm-and-approval.md`)
  - [ ] Implement `confirmQuotation()` — calls M4's `evaluateQuoteRisk`, creates approval steps
  - [ ] Implement `decideApproval()` — SM/Finance approval chain with `writeAudit`
  - [ ] Build routes: quotation CRUD, confirm, approval decision
  - [ ] Add `writeAudit` calls for create, line mutations, confirm
  - [ ] Write lifecycle + approval tests (`05-tests.md`)
- **Handoff:** Merge to `main`. This is the **big unlock** — Dev 2 and Dev 3 can now build M6/M7/M8.

### Sprint 3

#### M9 — Customer Portal Negotiation ★

- **Files:** `09-customer-portal-negotiation/01-data-model.md` through `03-portal-frontend.md` (backend only)
- **Tasks:**
  - [ ] Add `NegotiationRequest` model + status enum
  - [ ] Implement portal JWT minting/verification (separate secret + audience from internal auth)
  - [ ] Build `requirePortalAuth` middleware
  - [ ] Implement `sendToCustomer()` — APPROVED → SENT + mint portal token
  - [ ] Implement `portalConfirm()` — fold accepted counters, recompute risk, governance gate
  - [ ] Build portal routes at `/api/v1/portal` (no `:id` params — all from JWT claims)
  - [ ] Build internal rep routes: send, list negotiations, answer negotiation
  - [ ] Add `writeAudit` calls for portal confirm (escalated + confirmed) and negotiation answers

---

## Developer 2 — "Catalog & Commerce"

**Owns:** M1 → M2 → M6 → M8

This developer builds the data that feeds the spine (products, customers), then extends it with
upsell suggestions and billing.

### Sprint 1

#### M1 — Product & Price List Management

- **Files:** `01-product-pricelist/01-data-model.md` through `04-tests.md`
- **Tasks:**
  - [ ] Add `Product`, `ProductVariant`, `PriceList`, `PriceListItem` models to schema
  - [ ] Build CRUD service + controller + routes for products and variants
  - [ ] Build price list CRUD and `resolveUnitPrice({ productId, variantId, customerTier, currency })`
  - [ ] Update seed with catalog data (laptop, setup service, support subscription)
  - [ ] Mount at `/api/v1/products`, `/api/v1/price-lists`
  - [ ] Write tests for `resolveUnitPrice` (tier fallback, variant extra price)
- **Handoff:** Merge. Dev 1's M5 `addLine` can now call `resolveUnitPrice`.

#### M2 — Customer Management

- **Files:** `02-customer-management/01-data-model.md` through `02-backend.md`
- **Tasks:**
  - [ ] Add `Customer`, `CustomerContact` models (tier, currency, portal email)
  - [ ] Build CRUD service + controller + routes
  - [ ] Update seed with customers across tiers (Acme/Gold, Globex/Silver, Initech/Bronze)
  - [ ] Mount at `/api/v1/customers`
- **Handoff:** Merge. Dev 1's M5 can now load customer tier for risk evaluation.

### Sprint 2

#### M6 — Upsell & Cross-sell Engine

- **Files:** `06-upsell-crosssell/01-data-model.md` through `02-backend.md`
- **Blocked by:** M5 data model must be merged (need QuotationLine to attach suggestions)
- **Tasks:**
  - [ ] Add `UpsellRule`, `UpsellSuggestion` models
  - [ ] Implement deterministic ranker: co-purchase history + promotion boost + margin filter
  - [ ] Build `GET /quotations/:id/suggestions` — ranked list with margin delta
  - [ ] Build `POST /quotations/:id/suggestions/:ruleId/add` — add to quote, recompute totals/margin
  - [ ] Update seed with upsell rules (e.g. laptop → setup service pairing)

### Sprint 3

#### M8 — Hybrid Billing & Invoicing

- **Files:** `08-hybrid-billing/01-data-model.md` through `05-tests.md`
- **Blocked by:** M5 lifecycle edges (`CONFIRMED` state, `FULFILLMENT → BILLING → PAID` transitions)
- **Tasks:**
  - [ ] Add `SubscriptionPlan`, `BillingSchedule`, `Invoice`, `CreditNote`, `Payment` models
  - [ ] Implement `generateBillingSchedule()` — one-time invoice + recurring period invoices
  - [ ] Implement `prorate()` pure function for mid-cycle changes
  - [ ] Build `changeSubscription()` — upgrade/downgrade/cancel with prorated credit
  - [ ] Build `recordPayment()` — flip invoice to PAID, maybe finalize quote to PAID
  - [ ] Implement `onConfirmed()` hook (called by M5 and M9 portal confirm)
  - [ ] Build `moveToBilling()` lifecycle glue
  - [ ] Add `writeAudit` calls for subscription changes and payments
  - [ ] Write proration math tests

---

## Developer 3 — "Operations & Analytics"

**Owns:** M7 → M10 → M11 → M12

This developer handles warehouse operations, health monitoring, reporting, and the admin
configuration surface.

### Sprint 1

#### M7 — Warehouse Fulfillment (data model + pure optimizer)

- **Files:** `07-warehouse-fulfillment/01-data-model.md` + `02-split-optimizer.md`
- **Tasks (no M5 dependency for this phase):**
  - [ ] Add `Warehouse`, `StockLevel`, `FulfillmentPlan`, `FulfillmentSplit`, `Backorder` models
  - [ ] Implement `optimizeSplits(lines, warehouses)` — greedy algorithm (min shipments, then cost)
  - [ ] Write split optimizer unit tests (`05-tests.md`) — all pure, no DB
  - [ ] Update seed with two warehouses + stock levels
- **Note:** The optimizer is a pure function — it can be written and tested without M5.

### Sprint 2

#### M7 — Warehouse Fulfillment (backend wiring)

- **Files:** `07-warehouse-fulfillment/03-backend.md`
- **Blocked by:** M5 must be merged (need `CONFIRMED → FULFILLMENT` transition)
- **Tasks:**
  - [ ] Build `moveToFulfillment()` — transition + generate plan
  - [ ] Build `acceptPlan()` — validate live stock, decrement, commit
  - [ ] Build `overridePlan()` — manual reallocation with stock validation
  - [ ] Build `consolidateBackorder()` — re-run optimizer for outstanding qty
  - [ ] Build routes at `/api/v1/quotations/:id/fulfillment`
  - [ ] Add `writeAudit` calls for accept, override, consolidate

#### M10 — Deal Health Dashboard

- **Files:** `10-deal-health-dashboard/01-data-model.md` through `03-backend.md`
- **Blocked by:** M5 (scans quotations for staleness and anomalies)
- **Tasks:**
  - [ ] Add `DealHealthAlert` model + `AlertType` enum
  - [ ] Implement 3 pure detectors: `detectStalled`, `detectDiscountAnomaly`, `detectDeliverySlippage`
  - [ ] Implement `computeBaseline()` for rep-relative anomaly detection
  - [ ] Build `mergeCandidates()` — one alert per (quotation, type)
  - [ ] Build `refreshAlerts()` service — loads config from `SystemSetting`, scans, upserts alerts
  - [ ] Build routes: list alerts, nudge, escalate
  - [ ] Write detector unit tests (all pure, deterministic `now`)
  - [ ] Add `writeAudit` calls for nudge and escalate actions

### Sprint 3

#### M11 — Reporting & Dashboards

- **Files:** `11-reporting-dashboards/01-backend.md` + `02-export.md`
- **Tasks:**
  - [ ] Implement `buildReportDataset(filters, viewer)` — Prisma aggregations with rep-scoping
  - [ ] Build JSON endpoint: `GET /reports/sales`
  - [ ] Implement XLSX renderer (exceljs streaming) + PDF renderer (pdfkit)
  - [ ] Build export endpoints: `GET /reports/sales/export.xlsx`, `GET /reports/sales/export.pdf`
  - [ ] Enforce rep-scoping: `sales_rep` forced to own deals, managers see all

#### M12 — Audit & Admin Configuration

- **Files:** `12-audit-admin-config/01-audit-trail.md` + `02-system-settings.md`
- **Tasks:**
  - [ ] Audit all `writeAudit` call sites across M0–M11 — add any missing ones
  - [ ] Build admin settings CRUD: `GET /admin/settings`, `PUT /admin/settings/:key`
  - [ ] Build audit log query: `GET /admin/audit-logs` (paginated, filterable)
  - [ ] Add `writeAudit` for setting changes
  - [ ] Mount admin routes at `/api/v1/admin`

---

## Sprint-by-Sprint Summary

### Sprint 1 — Foundations (all 3 devs work in parallel after M0)

| Dev   | Modules                                   | Deliverable                                    | Merge order                 |
| ----- | ----------------------------------------- | ---------------------------------------------- | --------------------------- |
| Dev 1 | **M0** Foundation, **M3** Discount Config | Auth works, governance tables seeded           | M0 first (day 1–2), then M3 |
| Dev 2 | **M1** Products, **M2** Customers         | Catalog + customer CRUD, `resolveUnitPrice`    | After M0 is merged          |
| Dev 3 | **M7** (data model + optimizer only)      | Pure split algorithm tested, warehouses seeded | After M0 is merged          |

> **End of Sprint 1:** Login works, catalog browsable, governance configured, optimizer tested.

### Sprint 2 — The Spine + First Consumers

| Dev   | Modules                                      | Deliverable                                           | Blocked by              |
| ----- | -------------------------------------------- | ----------------------------------------------------- | ----------------------- |
| Dev 1 | **M4** Risk Engine, **M5** Quotation ★       | Quote → confirm → approve flow works end-to-end       | M1 + M2 done (Sprint 1) |
| Dev 2 | **M6** Upsell & Cross-sell                   | Live suggestions with margin delta                    | M5 data model available |
| Dev 3 | **M7** (backend wiring), **M10** Deal Health | Fulfillment splits committed, health alerts generated | M5 merged               |

> **End of Sprint 2:** PS §9 steps 1–5 work. The core quote-to-fulfillment flow is functional.

### Sprint 3 — Commerce + Portal + Analytics

| Dev   | Modules                                 | Deliverable                                    | Blocked by          |
| ----- | --------------------------------------- | ---------------------------------------------- | ------------------- |
| Dev 1 | **M9** Portal Negotiation               | Customer portal with governance gate           | M5 + M4 (own work)  |
| Dev 2 | **M8** Hybrid Billing                   | Schedule generation, proration, payments       | M5 lifecycle edges  |
| Dev 3 | **M11** Reporting, **M12** Admin Config | PDF/XLSX export, admin settings + audit viewer | M5 (quotation data) |

> **End of Sprint 3:** PS §9 steps 6–8 work. Full end-to-end flow from login to payment.

---

## Handoff & Coordination Rules

### 1. M0 is the gate

Dev 1 owns M0 and should merge it to `main` within the first 1–2 days. Dev 2 and Dev 3 cannot
start their Sprint 1 work until M0 is merged (they need auth, audit, money helpers).

### 2. M5 is the unlock

Dev 1's M5 is the critical path. Dev 2 and Dev 3's Sprint 2 work is blocked until M5's **data model**
is available. Dev 1 should merge the schema + basic CRUD first (even before confirm/approval is
done) so Dev 2 and Dev 3 can start writing code against the quotation tables.

### 3. Branch strategy

```
main ◄── feature/m0-foundation     (Dev 1, Sprint 1)
     ◄── feature/m1-products       (Dev 2, Sprint 1)
     ◄── feature/m2-customers      (Dev 2, Sprint 1)
     ◄── feature/m3-governance     (Dev 1, Sprint 1)
     ◄── feature/m7-optimizer      (Dev 3, Sprint 1)
     ◄── feature/m4-risk-engine    (Dev 1, Sprint 2)
     ◄── feature/m5-quotation      (Dev 1, Sprint 2) ★ critical merge
     ◄── feature/m6-upsell         (Dev 2, Sprint 2)
     ◄── feature/m7-fulfillment    (Dev 3, Sprint 2)
     ◄── feature/m10-deal-health   (Dev 3, Sprint 2)
     ◄── feature/m9-portal         (Dev 1, Sprint 3)
     ◄── feature/m8-billing        (Dev 2, Sprint 3)
     ◄── feature/m11-reporting     (Dev 3, Sprint 3)
     ◄── feature/m12-admin         (Dev 3, Sprint 3)
```

### 4. Schema conflicts

All 3 devs add models to `prisma/schema.prisma`. To avoid merge conflicts:

- **One dev adds models at a time** — merge M0's schema, then M1/M2/M3 can add below.
- Or use a **schema marker comment** (e.g. `// === M1: Products ===`) so each dev appends to their
  own section.
- Run `pnpm db:push && pnpm db:generate` after every schema merge.

### 5. Seed file coordination

The seed file (`prisma/seed.ts`) grows incrementally. Each dev adds their module's seed data in a
clearly marked section. Use `upsert` for idempotency.

---

## Risk Mitigation

| Risk                   | Impact                                                         | Mitigation                                                                  |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| M5 delayed             | Blocks Dev 2 Sprint 2 + Dev 3 Sprint 2                         | Dev 1 merges M5 schema + CRUD early; confirm/approval can land later        |
| M1/M2 delayed          | Blocks M5 `addLine` (needs `resolveUnitPrice` + customer tier) | Dev 2 prioritizes M1 over M2; Dev 1 can stub `resolveUnitPrice` temporarily |
| Schema merge conflicts | Broken `prisma/schema.prisma`                                  | Use section markers; one merge at a time; CI runs `db:push` on every PR     |
| Dev 3 idle in Sprint 1 | Only M7 optimizer to build (pure function)                     | Dev 3 also writes the M7+M10 unit tests and helps Dev 1 with M0 seed        |

---

## Reference: Planning Docs per Developer

### Dev 1 reads:

- `00-foundation-auth/` (all 6 files)
- `03-discount-governance-config/` (01 + 02)
- `04-blended-risk-engine/` (all 3 files)
- `05-quotation-builder-lifecycle/` (01 + 02 + 03 + 05)
- `09-customer-portal-negotiation/` (01 + 02)

### Dev 2 reads:

- `01-product-pricelist/` (01 + 02 + 04)
- `02-customer-management/` (01 + 02)
- `06-upsell-crosssell/` (01 + 02)
- `08-hybrid-billing/` (01 + 02 + 03 + 05)

### Dev 3 reads:

- `07-warehouse-fulfillment/` (01 + 02 + 03 + 05)
- `10-deal-health-dashboard/` (01 + 02 + 03)
- `11-reporting-dashboards/` (01 + 02)
- `12-audit-admin-config/` (01 + 02)
