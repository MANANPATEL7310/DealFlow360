// packages/shared/src/schemas/governance.ts
import { z } from "zod";

import { customerTierSchema, productCategorySchema } from "./product.js";

// ── Enums & Consts ────────────────────────────────────────────────────────────
export const approvalLevels = ["SALES_MANAGER", "FINANCE"] as const;
export type ApprovalLevel = (typeof approvalLevels)[number];
export const approvalLevelSchema = z.enum(approvalLevels);

// ── Schemas ───────────────────────────────────────────────────────────────────
export const upsertDiscountTierSchema = z.object({
  customerTier: customerTierSchema,
  maxDiscountPct: z.number().min(0).max(100),
});

export const upsertCategoryCeilingSchema = z.object({
  category: productCategorySchema,
  maxDiscountPct: z.number().min(0).max(100),
});

export const createApprovalRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required."),
  minScore: z.number().min(0, "Min score must be >= 0."),
  maxScore: z.number().min(0).nullable().optional(), // null/undefined = open-ended
  requiredLevels: z
    .array(approvalLevelSchema)
    .min(1, "At least one approver level is required."),
});

export const updateApprovalRuleSchema = createApprovalRuleSchema.partial();

export const discountTierResponseSchema = z.object({
  id: z.string(),
  customerTier: customerTierSchema,
  maxDiscountPct: z.number(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const categoryCeilingResponseSchema = z.object({
  id: z.string(),
  category: productCategorySchema,
  maxDiscountPct: z.number(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const approvalRuleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  minScore: z.number(),
  maxScore: z.number().nullable(),
  requiredLevels: z.array(approvalLevelSchema),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

// ── Derived Types ─────────────────────────────────────────────────────────────
export type UpsertDiscountTierInput = z.infer<typeof upsertDiscountTierSchema>;
export type UpsertCategoryCeilingInput = z.infer<
  typeof upsertCategoryCeilingSchema
>;
export type CreateApprovalRuleInput = z.infer<typeof createApprovalRuleSchema>;
export type UpdateApprovalRuleInput = z.infer<typeof updateApprovalRuleSchema>;
export type DiscountTierResponse = z.infer<typeof discountTierResponseSchema>;
export type CategoryCeilingResponse = z.infer<
  typeof categoryCeilingResponseSchema
>;
export type ApprovalRuleResponse = z.infer<typeof approvalRuleResponseSchema>;
