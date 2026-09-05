// packages/shared/src/schemas/portal.ts
import { z } from "zod";

// ─── Negotiation Status ──────────────────────────────────────────────────────
export const NegotiationStatusSchema = z.enum(["OPEN", "ANSWERED", "ACCEPTED"]);
export const negotiationStatusSchema = NegotiationStatusSchema;
export type NegotiationStatus = z.infer<typeof NegotiationStatusSchema>;

// ─── Send Quotation ───────────────────────────────────────────────────────────
export const sendQuotationSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required."),
});
export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;

// ─── Negotiation Request (Customer ask on line or entire quote) ───────────────
export const NegotiationRequestSchema = z.object({
  id: z.string(),
  quotationId: z.string(),
  contactId: z.string(),
  lineId: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  counterDiscountPct: z.number().min(0).max(100).nullable().optional(),
  status: NegotiationStatusSchema.default("OPEN"),
  repComment: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type NegotiationRequest = z.infer<typeof NegotiationRequestSchema>;

// ─── Customer-Safe Quotation Line Projection (Cost & Margin stripped) ────────
export const PortalQuotationLineSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  variantName: z.string().nullable().optional(),
  qty: z.number().int().positive(),
  unitPriceMinor: z.number().int().nonnegative(),
  discountPct: z.number().min(0).max(100),
  lineTotalMinor: z.number().int().nonnegative(),
  lineType: z.enum(["ONE_TIME", "RECURRING"]),
});
export type PortalQuotationLine = z.infer<typeof PortalQuotationLineSchema>;

// ─── Customer-Safe Quotation View ────────────────────────────────────────────
export const PortalQuotationViewSchema = z.object({
  id: z.string(),
  code: z.string(),
  customerName: z.string(),
  customerTier: z.enum(["BRONZE", "SILVER", "GOLD"]),
  contactName: z.string(),
  salesRepName: z.string(),
  subtotalMinor: z.number().int().nonnegative(),
  discountTotalMinor: z.number().int().nonnegative(),
  taxTotalMinor: z.number().int().nonnegative(),
  grandTotalMinor: z.number().int().nonnegative(),
  status: z.enum([
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
  ]),
  lines: z.array(PortalQuotationLineSchema),
  negotiations: z.array(NegotiationRequestSchema),
  expiresAt: z.string(),
});
export type PortalQuotationView = z.infer<typeof PortalQuotationViewSchema>;

// ─── Inputs ──────────────────────────────────────────────────────────────────
export const submitNegotiationSchema = z
  .object({
    lineId: z.string().nullable().optional(), // omit = order-level request
    comment: z.string().min(1).optional(),
    counterDiscountPct: z
      .number()
      .min(0, "Discount cannot be negative.")
      .max(100, "Discount cannot exceed 100%.")
      .optional(),
  })
  .refine(
    (v) =>
      (v.comment && v.comment.trim().length > 0) ||
      v.counterDiscountPct !== undefined,
    {
      message: "Either a comment or a counterDiscountPct is required.",
    },
  );
export type SubmitNegotiationInput = z.infer<typeof submitNegotiationSchema>;

export const CreateNegotiationInputSchema = submitNegotiationSchema;
export type CreateNegotiationInput = SubmitNegotiationInput;

export const answerNegotiationSchema = z.object({
  status: z.enum(["ACCEPTED", "ANSWERED"]),
  repComment: z.string().optional(),
});
export type AnswerNegotiationInput = z.infer<typeof answerNegotiationSchema>;

export const AnswerNegotiationInputSchema = answerNegotiationSchema;

// ─── Governance Confirmation Gate Result ─────────────────────────────────────
export const PortalConfirmResultSchema = z.object({
  status: z.enum(["CONFIRMED", "PENDING_APPROVAL"]),
  message: z.string(),
  requiresApproval: z.boolean(),
  requiredLevels: z.array(z.string()).default([]),
});
export type PortalConfirmResult = z.infer<typeof PortalConfirmResultSchema>;
