import { z } from "zod";

export const metricCardSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  trend: z.string(),
  tone: z.enum(["primary", "secondary", "success", "warning"]),
});

export const dashboardSummarySchema = z.object({
  title: z.string(),
  updatedAt: z.string(),
  metrics: z.array(metricCardSchema),
});

export type MetricCard = z.infer<typeof metricCardSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
