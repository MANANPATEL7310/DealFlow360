import { z } from "zod";

export const NegotiationOutput = z.object({
  draftMessage: z.string().min(1),
  recommendedCounterPct: z.number().min(0).max(100).optional(),
  wouldAutoApprove: z.boolean(),
  requiredLevelsIfAccepted: z.array(z.string()),
});

export type NegotiationOutput = z.infer<typeof NegotiationOutput>;
