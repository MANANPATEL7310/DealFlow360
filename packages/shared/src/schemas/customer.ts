// packages/shared/src/schemas/customer.ts
// === M2: Customer Management ===
import { z } from "zod";

// CustomerTier is OWNED by product.ts (M1 declared it first because PriceList needs it).
// Re-export it from here so consumers can import from either schema file.
export { customerTierSchema, type CustomerTier } from "./product.js";

// ─── Customer ─────────────────────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tier: z.enum(["BRONZE", "SILVER", "GOLD"]).default("BRONZE"),
  currency: z.string().default("USD"),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// ─── Customer Contact ─────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  name: z.string().min(1, "Name is required"),
  // optional portal fallback — hashed server-side, never sent back to client
  password: z.string().min(8).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
