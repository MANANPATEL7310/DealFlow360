import { z } from "zod";

// ─── Warehouse Schema ────────────────────────────────────────────────────────
export const warehouseSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().nullable().optional(),
  shippingCostWeight: z.number().positive().default(1.0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Warehouse = z.infer<typeof warehouseSchema>;

// ─── Stock Level Schema ──────────────────────────────────────────────────────
export const stockLevelSchema = z.object({
  id: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  quantity: z.number().int().nonnegative().default(0),
  replenishThreshold: z.number().int().nonnegative().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type StockLevel = z.infer<typeof stockLevelSchema>;

// ─── Fulfillment Split Schema ────────────────────────────────────────────────
export const fulfillmentSplitSchema = z.object({
  id: z.string(),
  planId: z.string(),
  warehouseId: z.string(),
  productId: z.string(),
  qty: z.number().int().positive(),
  shipmentCostMinor: z.number().int().nonnegative(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type FulfillmentSplit = z.infer<typeof fulfillmentSplitSchema>;

// ─── Backorder Schema ────────────────────────────────────────────────────────
export const backorderSchema = z.object({
  id: z.string(),
  planId: z.string(),
  productId: z.string(),
  qtyOutstanding: z.number().int().positive(),
  consolidatedAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Backorder = z.infer<typeof backorderSchema>;

// ─── Fulfillment Plan Schema ─────────────────────────────────────────────────
export const fulfillmentPlanStatuses = [
  "SUGGESTED",
  "ACCEPTED",
  "OVERRIDDEN",
] as const;
export type FulfillmentPlanStatus = (typeof fulfillmentPlanStatuses)[number];
export const fulfillmentPlanStatusSchema = z.enum(fulfillmentPlanStatuses);

export const fulfillmentPlanSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  status: fulfillmentPlanStatusSchema.default("SUGGESTED"),
  splits: z.array(fulfillmentSplitSchema).default([]),
  backorders: z.array(backorderSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type FulfillmentPlan = z.infer<typeof fulfillmentPlanSchema>;

// ─── Inputs ──────────────────────────────────────────────────────────────────
export const manualSplitInputSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse is required"),
  productId: z.string().min(1, "Product is required"),
  qty: z.number().int().positive("Quantity must be at least 1"),
});
export type ManualSplitInput = z.infer<typeof manualSplitInputSchema>;

export const overrideFulfillmentPlanInputSchema = z.object({
  splits: z.array(manualSplitInputSchema).min(1, "At least one split is required"),
});
export type OverrideFulfillmentPlanInput = z.infer<
  typeof overrideFulfillmentPlanInputSchema
>;

// ─── Seed Data ───────────────────────────────────────────────────────────────
export const SEED_WAREHOUSES: Warehouse[] = [
  {
    id: "wh-01",
    name: "Dallas Central Hub",
    location: "Dallas, TX",
    shippingCostWeight: 1.0,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "wh-02",
    name: "West Coast Facility",
    location: "San Jose, CA",
    shippingCostWeight: 1.3,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "wh-03",
    name: "East Coast Depot",
    location: "Newark, NJ",
    shippingCostWeight: 1.2,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
];

export const SEED_STOCK_LEVELS: StockLevel[] = [
  // Dallas Central
  { id: "stk-01-1", warehouseId: "wh-01", productId: "prd-hw-01", quantity: 6, replenishThreshold: 2 },
  { id: "stk-01-2", warehouseId: "wh-01", productId: "prd-hw-02", quantity: 5, replenishThreshold: 2 },
  { id: "stk-01-3", warehouseId: "wh-01", productId: "prd-srv-01", quantity: 999, replenishThreshold: 0 },
  { id: "stk-01-4", warehouseId: "wh-01", productId: "prd-srv-02", quantity: 999, replenishThreshold: 0 },
  { id: "stk-01-5", warehouseId: "wh-01", productId: "prd-sub-01", quantity: 9999, replenishThreshold: 0 },
  { id: "stk-01-6", warehouseId: "wh-01", productId: "prd-sub-02", quantity: 9999, replenishThreshold: 0 },

  // West Coast
  { id: "stk-02-1", warehouseId: "wh-02", productId: "prd-hw-01", quantity: 10, replenishThreshold: 3 },
  { id: "stk-02-2", warehouseId: "wh-02", productId: "prd-hw-02", quantity: 2, replenishThreshold: 2 },
  { id: "stk-02-3", warehouseId: "wh-02", productId: "prd-srv-01", quantity: 999, replenishThreshold: 0 },
  { id: "stk-02-4", warehouseId: "wh-02", productId: "prd-srv-02", quantity: 999, replenishThreshold: 0 },
  { id: "stk-02-5", warehouseId: "wh-02", productId: "prd-sub-01", quantity: 9999, replenishThreshold: 0 },
  { id: "stk-02-6", warehouseId: "wh-02", productId: "prd-sub-02", quantity: 9999, replenishThreshold: 0 },

  // East Coast
  { id: "stk-03-1", warehouseId: "wh-03", productId: "prd-hw-01", quantity: 4, replenishThreshold: 2 },
  { id: "stk-03-2", warehouseId: "wh-03", productId: "prd-hw-02", quantity: 8, replenishThreshold: 2 },
  { id: "stk-03-3", warehouseId: "wh-03", productId: "prd-srv-01", quantity: 999, replenishThreshold: 0 },
  { id: "stk-03-4", warehouseId: "wh-03", productId: "prd-srv-02", quantity: 999, replenishThreshold: 0 },
  { id: "stk-03-5", warehouseId: "wh-03", productId: "prd-sub-01", quantity: 9999, replenishThreshold: 0 },
  { id: "stk-03-6", warehouseId: "wh-03", productId: "prd-sub-02", quantity: 9999, replenishThreshold: 0 },
];

export const SEED_FULFILLMENT_PLANS: FulfillmentPlan[] = [
  {
    id: "flp-101",
    quotationId: "qt-101",
    status: "SUGGESTED",
    splits: [
      {
        id: "fls-101-1",
        planId: "flp-101",
        warehouseId: "wh-01",
        productId: "prd-hw-01",
        qty: 2,
        shipmentCostMinor: 500, // $5.00 freight
        createdAt: "2026-09-04T12:00:00.000Z",
      },
      {
        id: "fls-101-2",
        planId: "flp-101",
        warehouseId: "wh-01",
        productId: "prd-srv-01",
        qty: 1,
        shipmentCostMinor: 0,
        createdAt: "2026-09-04T12:00:00.000Z",
      },
    ],
    backorders: [],
    createdAt: "2026-09-04T12:00:00.000Z",
  },
];
