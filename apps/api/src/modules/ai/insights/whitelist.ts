import { z } from "zod";

export const ReportFilters = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    repId: z.string().cuid().optional(),
    status: z
      .enum([
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "SENT",
        "UNDER_NEGOTIATION",
        "CONFIRMED",
        "FULFILLMENT",
        "BILLING",
        "PAID",
        "REJECTED",
      ])
      .optional(),
    category: z.enum(["HARDWARE", "SERVICES", "SUBSCRIPTIONS"]).optional(),
  })
  .strict();

export type ReportFilters = z.infer<typeof ReportFilters>;
