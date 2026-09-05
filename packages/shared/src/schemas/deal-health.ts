import { z } from "zod";

export const alertFiltersSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]).optional(),
  type: z.enum(["STALLED", "DISCOUNT_ANOMALY", "DELIVERY_SLIPPAGE"]).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
});

export type AlertFilters = z.infer<typeof alertFiltersSchema>;

export const nudgeSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
  escalateToUserId: z.string().cuid().optional(),
});

export type NudgeInput = z.infer<typeof nudgeSchema>;
