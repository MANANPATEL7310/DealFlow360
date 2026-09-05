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
 * Strips passwordHash from a CustomerContact row.
 * This is a security measure — passwordHash must never appear in API responses.
 */
function stripHash<T extends { passwordHash: string | null }>(
  row: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _omit, ...safe } = row;
  return safe;
}
