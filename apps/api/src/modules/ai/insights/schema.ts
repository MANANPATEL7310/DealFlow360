import { z } from "zod";
import { ReportFilters } from "./whitelist.js";

export const InsightsOutput = z.object({
  interpretedFilters: ReportFilters,
  tableData: z.array(z.record(z.string(), z.unknown())),
  narrative: z.string().min(1),
  chartSpec: z
    .object({
      type: z.enum(["bar", "line", "pie"]),
      x: z.string(),
      y: z.string(),
    })
    .optional(),
});

export type InsightsOutput = z.infer<typeof InsightsOutput>;
