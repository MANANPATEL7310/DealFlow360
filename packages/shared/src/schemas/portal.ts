// packages/shared/src/schemas/portal.ts
import { z } from "zod";

export const negotiationStatusSchema = z.enum(["OPEN", "ANSWERED", "ACCEPTED"]);
export type NegotiationStatus = z.infer<typeof negotiationStatusSchema>;

export const sendQuotationSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required."),
});

export const submitNegotiationSchema = z
  .object({
    lineId: z.string().optional(), // omit = order-level request
    comment: z.string().min(1).optional(),
    counterDiscountPct: z
      .number()
      .min(0, "Discount cannot be negative.")
      .max(100, "Discount cannot exceed 100%.")
      .optional(),
  })
  .refine((v) => v.comment || v.counterDiscountPct !== undefined, {
    message: "Either a comment or a counterDiscountPct is required.",
  });

export const answerNegotiationSchema = z.object({
  status: z.enum(["ANSWERED", "ACCEPTED"]),
});

export type SendQuotationInput = z.infer<typeof sendQuotationSchema>;
export type SubmitNegotiationInput = z.infer<typeof submitNegotiationSchema>;
export type AnswerNegotiationInput = z.infer<typeof answerNegotiationSchema>;
