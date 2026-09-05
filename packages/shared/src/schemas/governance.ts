// packages/shared/src/schemas/governance.ts
import { z } from "zod";
import { customerTierSchema, productCategorySchema } from "./product";

// ── Enums & Consts ────────────────────────────────────────────────────────────
export const approvalLevels = ["SALES_MANAGER", "FINANCE"] as const;
export type ApprovalLevel = (typeof approvalLevels)[number];
export const approvalLevelSchema = z.enum(approvalLevels);

// ─── Discount Tier Ceiling ───────────────────────────────────────────────────
export const discountTierCeilingSchema = z.object({
  id: z.string(),
  customerTier: customerTierSchema,
  maxDiscountPct: z.number().min(0).max(100),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type DiscountTierCeiling = z.infer<typeof discountTierCeilingSchema>;

export const upsertDiscountTierSchema = z.object({
  customerTier: customerTierSchema,
  maxDiscountPct: z
    .number()
    .min(0, "Ceiling percentage must be at least 0%")
    .max(100, "Ceiling percentage cannot exceed 100%"),
});
export type UpsertDiscountTierInput = z.infer<typeof upsertDiscountTierSchema>;

export const discountTierResponseSchema = z.object({
  id: z.string(),
  customerTier: customerTierSchema,
  maxDiscountPct: z.number(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type DiscountTierResponse = z.infer<typeof discountTierResponseSchema>;

// ─── Category Discount Ceiling ───────────────────────────────────────────────
export const categoryDiscountCeilingSchema = z.object({
  id: z.string(),
  category: productCategorySchema,
  maxDiscountPct: z.number().min(0).max(100),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type CategoryDiscountCeiling = z.infer<
  typeof categoryDiscountCeilingSchema
>;

export const upsertCategoryCeilingSchema = z.object({
  category: productCategorySchema,
  maxDiscountPct: z
    .number()
    .min(0, "Ceiling percentage must be at least 0%")
    .max(100, "Ceiling percentage cannot exceed 100%"),
});
export type UpsertCategoryCeilingInput = z.infer<
  typeof upsertCategoryCeilingSchema
>;

export const categoryCeilingResponseSchema = z.object({
  id: z.string(),
  category: productCategorySchema,
  maxDiscountPct: z.number(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type CategoryCeilingResponse = z.infer<
  typeof categoryCeilingResponseSchema
>;

// ─── Approval Chain Rule ─────────────────────────────────────────────────────
export const approvalChainRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Rule name is required"),
  minScore: z.number().min(0, "Minimum score must be at least 0"),
  maxScore: z.number().min(0).nullable().optional(),
  requiredLevels: z
    .array(approvalLevelSchema)
    .min(1, "At least one approval level is required"),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type ApprovalChainRule = z.infer<typeof approvalChainRuleSchema>;

export const createApprovalRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required."),
  minScore: z.number().min(0, "Min score must be >= 0."),
  maxScore: z.number().min(0).nullable().optional(),
  requiredLevels: z
    .array(approvalLevelSchema)
    .min(1, "At least one approver level is required."),
});
export type CreateApprovalRuleInput = z.infer<typeof createApprovalRuleSchema>;

export const updateApprovalRuleSchema = createApprovalRuleSchema.partial();
export type UpdateApprovalRuleInput = z.infer<typeof updateApprovalRuleSchema>;

export const approvalRuleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  minScore: z.number(),
  maxScore: z.number().nullable(),
  requiredLevels: z.array(approvalLevelSchema),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});
export type ApprovalRuleResponse = z.infer<typeof approvalRuleResponseSchema>;

// ─── Simulation Types ────────────────────────────────────────────────────────
export const discountSimulationInputSchema = z.object({
  customerTier: customerTierSchema,
  category: productCategorySchema,
  requestedDiscountPct: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%"),
});
export type DiscountSimulationInput = z.infer<
  typeof discountSimulationInputSchema
>;

export interface DiscountSimulationResult {
  tierCapPct: number;
  categoryCapPct: number;
  applicableCapPct: number;
  excessDiscountPct: number;
  blendedRiskScore: number;
  isAutoApproved: boolean;
  requiredApprovers: ApprovalLevel[];
  matchedRuleName?: string;
}

// ─── Seed Defaults ───────────────────────────────────────────────────────────
export const SEED_DISCOUNT_TIERS: DiscountTierCeiling[] = [
  {
    id: "dt-bronze",
    customerTier: "BRONZE",
    maxDiscountPct: 5.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "dt-silver",
    customerTier: "SILVER",
    maxDiscountPct: 10.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "dt-gold",
    customerTier: "GOLD",
    maxDiscountPct: 15.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

export const SEED_CATEGORY_CEILINGS: CategoryDiscountCeiling[] = [
  {
    id: "cc-hardware",
    category: "HARDWARE",
    maxDiscountPct: 15.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "cc-services",
    category: "SERVICES",
    maxDiscountPct: 10.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "cc-subscriptions",
    category: "SUBSCRIPTIONS",
    maxDiscountPct: 12.0,
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];

export const SEED_APPROVAL_RULES: ApprovalChainRule[] = [
  {
    id: "acr-small-overage",
    name: "Small Overage Band",
    minScore: 0.01,
    maxScore: 3.0,
    requiredLevels: ["SALES_MANAGER"],
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "acr-high-risk",
    name: "High Risk Multi-Tier Band",
    minScore: 3.0,
    maxScore: null,
    requiredLevels: ["SALES_MANAGER", "FINANCE"],
    updatedAt: "2026-08-01T00:00:00.000Z",
  },
];
