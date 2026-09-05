import { z } from "zod";

export const productCategories = [
  "HARDWARE",
  "SERVICES",
  "SUBSCRIPTIONS",
] as const;
export type ProductCategory = (typeof productCategories)[number];
export const productCategorySchema = z.enum(productCategories);

export const customerTiers = ["BRONZE", "SILVER", "GOLD"] as const;
export type CustomerTier = (typeof customerTiers)[number];
export const customerTierSchema = z.enum(customerTiers);

export const productVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  attribute: z.string(),
  value: z.string(),
  extraPrice: z.number().int().nonnegative(), // in cents
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: productCategorySchema,
  unit: z.string().default("unit"),
  basePrice: z.number().int().positive(), // in cents
  unitCost: z.number().int().positive(), // in cents
  taxRatePct: z.number().default(0),
  description: z.string().nullable().optional(),
  isPromoted: z.boolean().default(false),
  variants: z.array(productVariantSchema).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters."),
  category: productCategorySchema,
  unit: z.string().min(1, "Unit of measure is required."),
  basePrice: z.number().int().positive("Base price must be greater than 0."),
  unitCost: z.number().int().positive("Unit cost must be greater than 0."),
  taxRatePct: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
  isPromoted: z.boolean().default(false),
});
export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export interface TierPricingSchedule {
  tier: "BASE" | CustomerTier;
  label: string;
  discountPct: number;
  unitPrice: number; // in cents
  marginPct: number;
  minQuantity: number;
}

export const SEED_PRODUCTS: Product[] = [
  {
    id: "prd-hw-01",
    name: "ApexEdge 2U Enterprise Server",
    category: "HARDWARE",
    unit: "unit",
    basePrice: 450000, // $4,500.00
    unitCost: 292500, // $2,925.00 (35.0% margin)
    taxRatePct: 8.5,
    description:
      "Dual-socket Xeon Scalable architecture with redundant 1100W platinum hot-plug power supplies.",
    isPromoted: true,
    variants: [
      {
        id: "var-01-a",
        productId: "prd-hw-01",
        attribute: "Memory",
        value: "64GB ECC DDR5",
        extraPrice: 0,
      },
      {
        id: "var-01-b",
        productId: "prd-hw-01",
        attribute: "Memory",
        value: "128GB ECC DDR5",
        extraPrice: 60000, // +$600.00
      },
      {
        id: "var-01-c",
        productId: "prd-hw-01",
        attribute: "Memory",
        value: "256GB ECC DDR5",
        extraPrice: 140000, // +$1,400.00
      },
    ],
    createdAt: "2026-08-15T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "prd-hw-02",
    name: "QuantumSwitch 48-Port 10GbE",
    category: "HARDWARE",
    unit: "unit",
    basePrice: 280000, // $2,800.00
    unitCost: 182000, // $1,820.00 (35.0% margin)
    taxRatePct: 8.5,
    description:
      "High-density top-of-rack L3 managed switch with 4x 40GbE uplink ports.",
    isPromoted: false,
    variants: [
      {
        id: "var-02-a",
        productId: "prd-hw-02",
        attribute: "Power Supply",
        value: "Single AC Supply",
        extraPrice: 0,
      },
      {
        id: "var-02-b",
        productId: "prd-hw-02",
        attribute: "Power Supply",
        value: "Dual Hot-Swap Redundant",
        extraPrice: 40000, // +$400.00
      },
    ],
    createdAt: "2026-08-18T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: "prd-sub-01",
    name: "DealFlow Cloud Platform Enterprise",
    category: "SUBSCRIPTIONS",
    unit: "licence/mo",
    basePrice: 12000, // $120.00 / mo
    unitCost: 2400, // $24.00 / mo (80.0% margin)
    taxRatePct: 0,
    description:
      "Core SaaS license for algorithmic quoting, multi-tier approvals, and margin tracking.",
    isPromoted: true,
    variants: [
      {
        id: "var-03-a",
        productId: "prd-sub-01",
        attribute: "SLA Tier",
        value: "99.9% Uptime Standard",
        extraPrice: 0,
      },
      {
        id: "var-03-b",
        productId: "prd-sub-01",
        attribute: "SLA Tier",
        value: "99.99% Mission-Critical Dedicated",
        extraPrice: 5000, // +$50.00 / mo
      },
    ],
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
  },
  {
    id: "prd-sub-02",
    name: "SecureGuard Endpoint Threat Shield",
    category: "SUBSCRIPTIONS",
    unit: "endpoint/mo",
    basePrice: 4500, // $45.00 / mo
    unitCost: 1125, // $11.25 / mo (75.0% margin)
    taxRatePct: 0,
    description:
      "Automated threat detection, behavioral heuristics, and continuous compliance agent.",
    isPromoted: true,
    variants: [],
    createdAt: "2026-08-22T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
  },
  {
    id: "prd-srv-01",
    name: "Cloud Architecture & Migration Sprint",
    category: "SERVICES",
    unit: "hour",
    basePrice: 25000, // $250.00 / hr
    unitCost: 11250, // $112.50 / hr (55.0% margin)
    taxRatePct: 0,
    description:
      "Senior Principal Solutions Architect dedicated to workload migration and infrastructure hardening.",
    isPromoted: false,
    variants: [],
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  },
  {
    id: "prd-srv-02",
    name: "Dedicated Technical Account Manager",
    category: "SERVICES",
    unit: "month",
    basePrice: 350000, // $3,500.00 / mo
    unitCost: 175000, // $1,750.00 / mo (50.0% margin)
    taxRatePct: 0,
    description:
      "Named technical advocate with bi-weekly executive reviews and priority escalation routing.",
    isPromoted: false,
    variants: [],
    createdAt: "2026-08-28T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  },
];
