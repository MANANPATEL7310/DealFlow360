import { z } from "zod";

export const reportFiltersSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  repId: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;

export const reportSummarySchema = z.object({
  quoteCount: z.number(),
  grossMinor: z.number(),
  netMinor: z.number(),
  costMinor: z.number(),
  discountMinor: z.number(),
  discountPct: z.number(),
  marginPct: z.number(),
});

export type ReportSummary = z.infer<typeof reportSummarySchema>;

export const reportFunnelStageSchema = z.object({
  status: z.string(),
  count: z.number(),
  netMinor: z.number(),
});

export type ReportFunnelStage = z.infer<typeof reportFunnelStageSchema>;

export const reportCategoryContributionSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  lineCount: z.number(),
  netMinor: z.number(),
  grossMinor: z.number(),
  marginPct: z.number(),
});

export type ReportCategoryContribution = z.infer<
  typeof reportCategoryContributionSchema
>;

export const reportDatasetSchema = z.object({
  filters: reportFiltersSchema.extend({
    effectiveRepId: z.string().optional(),
  }),
  summary: reportSummarySchema,
  funnel: z.array(reportFunnelStageSchema),
  categoryBreakdown: z.array(reportCategoryContributionSchema).optional(),
});

export type ReportDataset = z.infer<typeof reportDatasetSchema>;
