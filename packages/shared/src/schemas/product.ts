// packages/shared/src/schemas/product.ts
// === M1: Product & Price List ===
import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const productCategorySchema = z.enum([
  "HARDWARE",
  "SERVICES",
  "SUBSCRIPTIONS",
]);

// CustomerTier lives here because PriceList.customerTier needs it.
// Module 2 (customer.ts) re-exports this — do NOT declare it again there.
export const customerTierSchema = z.enum(["BRONZE", "SILVER", "GOLD"]);

// ─── Product ──────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: productCategorySchema,
  unit: z.string().default("unit"), // "unit" | "licence" | "hour" …
  basePrice: z.number().int().nonnegative(), // minor units (cents)
  unitCost: z.number().int().nonnegative(), // minor units — needed for margin
  taxRatePct: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
  isPromoted: z.boolean().default(false), // ranks higher in upsell (M6)
});

export const updateProductSchema = createProductSchema.partial();

// ─── Product Variant ──────────────────────────────────────────────────────────

export const createProductVariantSchema = z.object({
  productId: z.string().min(1),
  attribute: z.string().min(1), // e.g. "Size", "Pack"
  value: z.string().min(1), // e.g. "Large", "10-pack"
  extraPrice: z.number().int().nonnegative().default(0), // minor units, added on top of resolved base
});

export const updateProductVariantSchema = createProductVariantSchema.partial();

// ─── Price List ───────────────────────────────────────────────────────────────

export const createPriceListSchema = z.object({
  name: z.string().min(1),
  currency: z.string().default("USD"),
  customerTier: customerTierSchema.optional(), // null = default list (all tiers)
});

export const updatePriceListSchema = createPriceListSchema.partial();

export const addPriceListItemSchema = z.object({
  productId: z.string().min(1),
  price: z.number().int().nonnegative(), // minor units, overrides Product.basePrice
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductCategory = z.infer<typeof productCategorySchema>;
export type CustomerTier = z.infer<typeof customerTierSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type CreatePriceListInput = z.infer<typeof createPriceListSchema>;
export type AddPriceListItemInput = z.infer<typeof addPriceListItemSchema>;
