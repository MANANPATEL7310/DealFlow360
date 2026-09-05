// packages/shared/src/schemas/quotation.ts
import { z } from "zod";

export const quotationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "UNDER_NEGOTIATION",
  "CONFIRMED",
  "FULFILLMENT",
  "BILLING",
  "PAID",
  "REJECTED",
]);
export type QuotationStatus = z.infer<typeof quotationStatusSchema>;

export const lineTypeSchema = z.enum(["ONE_TIME", "RECURRING"]);
export type LineType = z.infer<typeof lineTypeSchema>;

export const approverLevelSchema = z.enum(["SALES_MANAGER", "FINANCE"]);
export type ApproverLevel = z.infer<typeof approverLevelSchema>;

export const approvalDecisionSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RETURNED",
]);
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

// ── Input Schemas ─────────────────────────────────────────────────────────────
export const createQuotationSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required."),
});

export const addLineSchema = z
  .object({
    productId: z.string().min(1, "Product ID is required."),
    variantId: z.string().optional(),
    qty: z.number().int().positive("Quantity must be >= 1.").default(1),
    discountPct: z
      .number()
      .min(0, "Discount cannot be negative.")
      .max(100, "Discount cannot exceed 100%.")
      .default(0),
    lineType: lineTypeSchema.default("ONE_TIME"),
    subscriptionPlanId: z.string().optional(),
  })
  .refine((v) => v.lineType !== "RECURRING" || !!v.subscriptionPlanId, {
    message: "subscriptionPlanId is required for RECURRING lines.",
    path: ["subscriptionPlanId"],
  });

export const updateLineSchema = z.object({
  qty: z.number().int().positive("Quantity must be >= 1.").optional(),
  discountPct: z
    .number()
    .min(0, "Discount cannot be negative.")
    .max(100, "Discount cannot exceed 100%.")
    .optional(),
});

export const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  reason: z.string().min(1, "Reason is required for all approval decisions."),
});

// ── Types ─────────────────────────────────────────────────────────────────────
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type AddLineInput = z.infer<typeof addLineSchema>;
export type UpdateLineInput = z.infer<typeof updateLineSchema>;
export type DecisionInput = z.infer<typeof decisionSchema>;
