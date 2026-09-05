import { z } from "zod";

export const RecommendationOutput = z.object({
  suggestions: z.array(
    z.object({
      productId: z.string(),
      reason: z.string().min(1),
      marginDeltaPct: z.number(),
    }),
  ),
});

export type RecommendationOutput = z.infer<typeof RecommendationOutput>;
