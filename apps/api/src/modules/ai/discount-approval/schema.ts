import { z } from "zod";

export const DiscountApprovalOutput = z.object({
  recommendation: z.enum(["APPROVE", "ADJUST", "REJECT"]),
  rationale: z.string().min(1),
  suggestedAdjustments: z
    .array(
      z.object({
        lineId: z.string(),
        toDiscountPct: z.number().min(0).max(100),
      }),
    )
    .optional(),
  confidence: z.number().min(0).max(1),
});

export type DiscountApprovalOutput = z.infer<typeof DiscountApprovalOutput>;
