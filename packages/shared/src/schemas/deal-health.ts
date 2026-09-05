import { z } from "zod";

// ─── Anomaly Classification ──────────────────────────────────────────────────
export const DealAnomalyTypeSchema = z.enum([
  "STALLED",
  "DISCOUNT_ANOMALY",
  "DELIVERY_SLIPPAGE",
  "MARGIN_EROSION",
]);
export type DealAnomalyType = z.infer<typeof DealAnomalyTypeSchema>;

export const DealHealthSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export type DealHealthSeverity = z.infer<typeof DealHealthSeveritySchema>;

export const DealHealthStatusSchema = z.enum([
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
]);
export type DealHealthStatus = z.infer<typeof DealHealthStatusSchema>;

// ─── Anomaly Alert Item ──────────────────────────────────────────────────────
export const DealHealthAlertSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  quotationCode: z.string(),
  customerName: z.string(),
  customerTier: z.enum(["BRONZE", "SILVER", "GOLD"]),
  salesRepName: z.string(),
  type: DealAnomalyTypeSchema,
  severity: DealHealthSeveritySchema,
  title: z.string(),
  detail: z.string(),
  metrics: z
    .object({
      idleDays: z.number().optional(),
      discountPct: z.number().optional(),
      baselineDiscountPct: z.number().optional(),
      deficitUnits: z.number().optional(),
      marginPct: z.number().optional(),
      atRiskAmountMinor: z.number().optional(),
    })
    .default({}),
  recommendedAction: z.string(),
  status: DealHealthStatusSchema.default("open"),
  acknowledgedBy: z.string().nullable().optional(),
  acknowledgedAt: z.string().nullable().optional(),
  resolutionNote: z.string().nullable().optional(),
  resolvedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DealHealthAlert = z.infer<typeof DealHealthAlertSchema>;

export const alertFiltersSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  type: z
    .enum([
      "STALLED",
      "DISCOUNT_ANOMALY",
      "DELIVERY_SLIPPAGE",
      "MARGIN_EROSION",
    ])
    .optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});
export type AlertFilters = z.infer<typeof alertFiltersSchema>;

// ─── Composite Health Score ──────────────────────────────────────────────────
export const HealthCategorySchema = z.enum([
  "HEALTHY",
  "WATCH",
  "AT_RISK",
  "CRITICAL",
]);
export type HealthCategory = z.infer<typeof HealthCategorySchema>;

export const DealHealthScoreSchema = z.object({
  quotationId: z.string(),
  quotationCode: z.string(),
  customerName: z.string(),
  customerTier: z.enum(["BRONZE", "SILVER", "GOLD"]),
  salesRepName: z.string(),
  score: z.number().min(0).max(100),
  category: HealthCategorySchema,
  stage: z.string(),
  netTotalMinor: z.number(),
  marginPct: z.number(),
  daysInStage: z.number(),
  factors: z.object({
    marginHealth: z.number().min(0).max(100),
    velocityHealth: z.number().min(0).max(100),
    fulfillmentHealth: z.number().min(0).max(100),
    discountCompliance: z.number().min(0).max(100),
  }),
  activeAlertCount: z.number().default(0),
  activeAnomalies: z.array(DealAnomalyTypeSchema).default([]),
});
export type DealHealthScore = z.infer<typeof DealHealthScoreSchema>;

// ─── Platform Radar Summary & KPIs ───────────────────────────────────────────
export const DealHealthSummarySchema = z.object({
  monitoredDealsCount: z.number(),
  healthyDealsCount: z.number(),
  watchDealsCount: z.number(),
  atRiskDealsCount: z.number(),
  criticalDealsCount: z.number(),
  totalAtRiskValueMinor: z.number(),
  openAlertsCount: z.number(),
  anomaliesByType: z.record(DealAnomalyTypeSchema, z.number()),
  lastScannedAt: z.string(),
});
export type DealHealthSummary = z.infer<typeof DealHealthSummarySchema>;

// ─── Action Inputs ───────────────────────────────────────────────────────────
export const AcknowledgeAlertInputSchema = z.object({
  note: z.string().optional(),
});
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertInputSchema>;

export const ResolveAlertInputSchema = z.object({
  resolutionNote: z.string().min(1, "Resolution note is required."),
  actionTaken: z
    .enum([
      "DISCOUNT_REVISED",
      "DEAL_ACCELERATED",
      "STOCK_ALLOCATED",
      "MANAGER_OVERRIDE",
      "FALSE_POSITIVE",
    ])
    .default("MANAGER_OVERRIDE"),
});
export type ResolveAlertInput = z.infer<typeof ResolveAlertInputSchema>;

export const nudgeSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
  escalateToUserId: z.string().cuid().optional(),
});
export type NudgeInput = z.infer<typeof nudgeSchema>;
