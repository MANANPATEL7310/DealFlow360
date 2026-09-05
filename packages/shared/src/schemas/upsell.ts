import { z } from "zod";
import { type Product, productSchema } from "./product";

// ─── Upsell Rule Schema ──────────────────────────────────────────────────────
export const upsellRuleSchema = z.object({
  id: z.string(),
  productId: z.string(),
  suggestedId: z.string(),
  coPurchaseScore: z.number().min(0).max(1).default(0),
  minMarginPct: z.number().min(0).max(100).default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type UpsellRule = z.infer<typeof upsellRuleSchema>;

// ─── Upsell Suggestion Item ──────────────────────────────────────────────────
export const upsellSuggestionItemSchema = z.object({
  product: productSchema,
  marginDeltaPct: z.number(),
  resultingOrderMarginPct: z.number(),
  promoted: z.boolean().default(false),
  coPurchaseScore: z.number().default(0),
  suggestionMarginPct: z.number().default(0),
  score: z.number().default(0),
});
export type UpsellSuggestionItem = z.infer<typeof upsellSuggestionItemSchema>;

// ─── Seed Rules ──────────────────────────────────────────────────────────────
export const SEED_UPSELL_RULES: UpsellRule[] = [
  {
    id: "ups-01",
    productId: "prd-hw-01", // HyperEdge Server Node X9
    suggestedId: "prd-sub-02", // AI Risk & Governance Copilot
    coPurchaseScore: 0.88,
    minMarginPct: 25.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ups-02",
    productId: "prd-hw-01", // HyperEdge Server Node X9
    suggestedId: "prd-hw-02", // QuantumSwitch 48-Port 10GbE
    coPurchaseScore: 0.78,
    minMarginPct: 20.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ups-03",
    productId: "prd-hw-01", // HyperEdge Server Node X9
    suggestedId: "prd-srv-02", // 24/7 Dedicated Technical Support
    coPurchaseScore: 0.82,
    minMarginPct: 25.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ups-04",
    productId: "prd-hw-02", // QuantumSwitch 48-Port 10GbE
    suggestedId: "prd-srv-02", // 24/7 Dedicated Technical Support
    coPurchaseScore: 0.72,
    minMarginPct: 20.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ups-05",
    productId: "prd-srv-01", // Enterprise Architecture Review
    suggestedId: "prd-sub-01", // DealFlow Cloud Platform Enterprise
    coPurchaseScore: 0.92,
    minMarginPct: 30.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "ups-06",
    productId: "prd-sub-01", // DealFlow Cloud Platform Enterprise
    suggestedId: "prd-sub-02", // AI Risk & Governance Copilot
    coPurchaseScore: 0.85,
    minMarginPct: 35.0,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
];
