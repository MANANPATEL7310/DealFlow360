// apps/api/src/modules/customer/customer.service.ts
// === M2: Customer + CustomerContact services ===
//
// customerService — standard CRUD via createCrudService factory
// listContacts / addContact — bespoke functions because:
//   (a) addContact needs to hash the optional password before persisting
//   (b) listContacts must strip passwordHash from every returned row

import bcrypt from "bcryptjs";
import { createCrudService } from "../../lib/crud-factory.js";
import { db } from "../../lib/db.js";
import { mintPortalToken } from "../portal/portal.token.js";

/** Standard CRUD for Customer: findMany / findById / create / update / delete / count */
export const customerService = createCrudService("customer");

// ─── Contact helpers (bespoke — not using CRUD factory) ───────────────────────

/**
 * List all contacts for a customer, ordered newest first.
 * passwordHash is stripped from every returned row — never sent to the client.
 */
export async function listContacts(customerId: string) {
  const rows = await db.customerContact.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(stripHash);
}

/**
 * Create a new contact for a customer.
 * If an optional password is provided, it's hashed with bcrypt before storage.
 * The returned row has passwordHash stripped.
 */
export async function addContact(
  customerId: string,
  input: { email: string; name: string; password?: string },
) {
  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 10)
    : null;

  const row = await db.customerContact.create({
    data: {
      customerId,
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  return stripHash(row);
}

/**
 * Customer-directory links are always tied to a real approved/sent quotation.
 * This prevents a contact link from exposing an arbitrary customer account.
 */
export async function generateMagicLink(customerId: string, contactId: string) {
  const contact = await db.customerContact.findFirst({
    where: { id: contactId, customerId },
  });
  if (!contact)
    throw Object.assign(new Error("CONTACT_NOT_FOUND"), { http: 404 });
  const quotation = await db.quotation.findFirst({
    where: {
      customerId,
      status: { in: ["APPROVED", "SENT", "UNDER_NEGOTIATION"] },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, customer: { select: { name: true } } },
  });
  if (!quotation)
    throw Object.assign(new Error("NO_SHAREABLE_QUOTATION"), { http: 409 });
  const token = mintPortalToken({ quotationId: quotation.id, contactId });
  return {
    token,
    url: `/portal?token=${token}`,
    expiresAt: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    contactEmail: contact.email,
    customerName: quotation.customer.name,
  };
}

/**
 * Strips passwordHash from a CustomerContact row.
 * This is a security measure — passwordHash must never appear in API responses.
 */
function stripHash<T extends { passwordHash: string | null }>(
  row: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _omit, ...safe } = row;
  return safe;
}

/**
 * Load non-PII aggregate customer history for AI agents.
 * Returns only tier, avg discount, deal count, and won rate.
 */
export async function loadCustomerHistory(params: {
  customerId?: string;
  quotationId?: string;
  requestId?: string;
}) {
  let customerId = params.customerId;

  if (!customerId && params.quotationId) {
    const q = await db.quotation.findUnique({
      where: { id: params.quotationId },
      select: { customerId: true },
    });
    customerId = q?.customerId;
  }

  if (!customerId && params.requestId) {
    const neg = await db.negotiationRequest.findUnique({
      where: { id: params.requestId },
      select: { quotation: { select: { customerId: true } } },
    });
    customerId = neg?.quotation?.customerId;
  }

  if (!customerId) {
    return {
      tier: "STANDARD",
      avgDiscountPct: 0,
      dealCount: 0,
      wonRate: 0,
    };
  }

  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      quotations: {
        include: {
          lines: {
            select: { discountPct: true },
          },
        },
      },
    },
  });

  if (!customer) {
    return {
      tier: "STANDARD",
      avgDiscountPct: 0,
      dealCount: 0,
      wonRate: 0,
    };
  }

  const quotations = customer.quotations || [];
  const dealCount = quotations.length;
  const wonCount = quotations.filter((q) =>
    ["CONFIRMED", "BILLING", "PAID"].includes(q.status),
  ).length;
  const wonRate = dealCount > 0 ? Number((wonCount / dealCount).toFixed(2)) : 0;

  const allLines = quotations.flatMap((q) => q.lines);
  const avgDiscountPct =
    allLines.length > 0
      ? Number(
          (
            allLines.reduce((acc, l) => acc + (l.discountPct || 0), 0) /
            allLines.length
          ).toFixed(2),
        )
      : 0;

  return {
    tier: customer.tier,
    avgDiscountPct,
    dealCount,
    wonRate,
  };
}
