import { z } from "zod";

export const actorKindSchema = z.enum(["user", "customer", "system"]);
export type ActorKind = z.infer<typeof actorKindSchema>;

export const auditLogSchema = z.object({
  id: z.string(),
  actorId: z.string().nullable().optional(),
  actorName: z.string().nullable().optional(),
  actorKind: actorKindSchema,
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  reason: z.string().nullable().optional(),
  diff: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string(),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogQuerySchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export const settingCategorySchema = z.enum(["risk", "health", "ai", "general"]);
export type SettingCategory = z.infer<typeof settingCategorySchema>;

export const systemSettingSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.unknown(),
  category: settingCategorySchema,
  label: z.string(),
  description: z.string(),
  scope: z.string().default("global"),
  updatedAt: z.string(),
});

export type SystemSetting = z.infer<typeof systemSettingSchema>;

export const updateSettingInputSchema = z.object({
  value: z.unknown(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingInputSchema>;

export interface CanonicalSettingDef {
  key: string;
  category: SettingCategory;
  label: string;
  description: string;
  defaultValue: unknown;
  type: "number" | "boolean" | "string";
}

export const CANONICAL_SETTINGS: CanonicalSettingDef[] = [
  {
    key: "risk.perLineTolerancePct",
    category: "risk",
    label: "Per-Line Tolerance (% Over Ceiling)",
    description: "Finance escalation is automatically required when any line exceeds its tier discount ceiling by more than this percentage.",
    defaultValue: 5,
    type: "number",
  },
  {
    key: "risk.blendedThreshold",
    category: "risk",
    label: "Blended Risk Score Threshold",
    description: "Escalates quote to Finance review when blended deal risk calculation exceeds this composite score.",
    defaultValue: 3,
    type: "number",
  },
  {
    key: "risk.financeValueThresholdMinor",
    category: "risk",
    label: "Finance Value Threshold ($ in cents)",
    description: "Quotes with total discounted value exceeding this threshold ($5,000.00 = 500000 cents) require Finance sign-off.",
    defaultValue: 500000,
    type: "number",
  },
  {
    key: "health.stalledDays",
    category: "health",
    label: "Deal Stagnation Horizon (Days)",
    description: "Quotations residing in active negotiation or review stages with no customer or rep activity past this threshold are flagged as stalled.",
    defaultValue: 7,
    type: "number",
  },
  {
    key: "health.anomalyK",
    category: "health",
    label: "Discount Anomaly Sensitivity (k × σ)",
    description: "Statistical z-score multiplier for anomaly detection: flags discounts exceeding k standard deviations above the rep baseline.",
    defaultValue: 2,
    type: "number",
  },
  {
    key: "health.minBaselineSample",
    category: "health",
    label: "Minimum Rep Baseline Deal Sample",
    description: "Minimum historical deal volume required for a sales representative before autonomous discount anomaly detection activates.",
    defaultValue: 5,
    type: "number",
  },
  {
    key: "ai.enabled",
    category: "ai",
    label: "AI Features (Master Kill-Switch)",
    description: "Global runtime kill-switch controlling autonomous agent evaluation and LLM recommendation assistants.",
    defaultValue: false,
    type: "boolean",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud-101",
    actorId: "usr-admin-01",
    actorName: "System Administrator",
    actorKind: "user",
    action: "settings.updated",
    entity: "SystemSetting",
    entityId: "risk.perLineTolerancePct",
    reason: "Tightened governance tolerance ahead of Q3 end-of-quarter audit.",
    diff: {
      key: "risk.perLineTolerancePct",
      before: 7,
      after: 5,
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "aud-102",
    actorId: "usr-mgr-01",
    actorName: "Sarah Chen (Commercial Mgr)",
    actorKind: "user",
    action: "approval.approved",
    entity: "ApprovalStep",
    entityId: "step-qt-102-1",
    reason: "Approved 16.5% discount due to verified multi-year commitment with Nordic Dynamics.",
    diff: {
      quotationId: "qt-102",
      status: "APPROVED",
      discountPct: 16.5,
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "aud-103",
    actorId: null,
    actorName: "Customer (Marcus Brody)",
    actorKind: "customer",
    action: "portal.negotiations.counter_submitted",
    entity: "Quotation",
    entityId: "qt-102",
    reason: "Submitted counter-offer requesting 18.0% volume discount.",
    diff: {
      counterDiscountPct: 18.0,
      targetPriceDollars: 72000,
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "aud-104",
    actorId: null,
    actorName: "Autonomous Health Radar",
    actorKind: "system",
    action: "health.anomaly.detected",
    entity: "DealHealthAlert",
    entityId: "alt-dsc-qt-102",
    reason: "Blended discount 16.5% exceeded Silver Tier baseline 12.0%.",
    diff: {
      severity: "high",
      atRiskMinor: 480000,
    },
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "aud-105",
    actorId: "usr-sales-01",
    actorName: "Alex Miller",
    actorKind: "user",
    action: "quotation.confirmed",
    entity: "Quotation",
    entityId: "qt-101",
    reason: "Finalized hardware and recurring license quotation package.",
    diff: {
      grandTotalMinor: 4924800,
      marginPct: 41.25,
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "aud-106",
    actorId: "usr-fin-01",
    actorName: "Marcus Vance (Finance)",
    actorKind: "user",
    action: "governance.tier.upserted",
    entity: "DiscountTier",
    entityId: "tier-gold",
    reason: "Updated Gold Tier ceiling to 20% standard margin.",
    diff: {
      tier: "GOLD",
      before: 22,
      after: 20,
    },
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "aud-107",
    actorId: "usr-fin-01",
    actorName: "Marcus Vance (Finance)",
    actorKind: "user",
    action: "billing.payment.recorded",
    entity: "Invoice",
    entityId: "inv-2026-001",
    reason: "Recorded wire transfer settlement for Initial Delivery batch.",
    diff: {
      amountMinor: 2462400,
      status: "PAID",
    },
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];
