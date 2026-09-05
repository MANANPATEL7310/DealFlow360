import { z } from "zod";

export const BillingOutput = z.object({
  explanation: z.string().min(1),
  prorationBreakdown: z
    .array(
      z.object({
        periodStart: z.string(),
        periodEnd: z.string(),
        amountMinor: z.number().int(), // integer minor units — never a float
      }),
    )
    .optional(),
  proposedCreditNote: z
    .object({
      amountMinor: z.number().int().positive(),
      reason: z.string().min(1),
      sourceInvoiceId: z.string(),
    })
    .optional(),
});

export type BillingOutput = z.infer<typeof BillingOutput>;
