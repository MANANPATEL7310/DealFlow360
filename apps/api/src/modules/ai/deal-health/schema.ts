import { z } from "zod";

export const DealHealthOutput = z.object({
  prioritized: z.array(
    z.object({
      alertId: z.string(),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      whySummary: z.string().min(1),
      draftMessage: z.string().min(1),
      suggestedAction: z.string().min(1),
    }),
  ),
});

export type DealHealthOutput = z.infer<typeof DealHealthOutput>;
