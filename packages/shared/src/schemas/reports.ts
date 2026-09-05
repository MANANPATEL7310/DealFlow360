import { z } from "zod";

export const reportFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  repId: z.string().cuid().optional(),
  status: z.string().optional(),
  category: z.enum(["HARDWARE", "SERVICES", "SUBSCRIPTIONS"]).optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
