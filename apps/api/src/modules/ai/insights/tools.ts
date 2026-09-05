import type { AgentTool } from "../../../ai/tools/types.js";
import { db } from "../../../lib/db.js";
import { listReps, runReport } from "../../reports/report-dataset.js";
import { ReportFilters } from "./whitelist.js";

export const runSalesReport: AgentTool = {
  name: "run_sales_report",
  description:
    "Run an M11 sales report after validating filters against the fixed whitelist.",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string" },
      to: { type: "string" },
      repId: { type: "string" },
      status: { type: "string" },
      category: {
        type: "string",
        enum: ["HARDWARE", "SERVICES", "SUBSCRIPTIONS"],
      },
    },
    required: [],
  },
  handler: async (args, ctx) => {
    const filters = ReportFilters.parse(args);
    return runReport(filters, {
      sub: ctx.actorId,
      role: ctx.actorRole ?? "sales_rep",
    });
  },
};

export const reps: AgentTool = {
  name: "list_reps",
  description:
    "Valid rep ids, names, and roles for resolving a report question.",
  parameters: { type: "object", properties: {}, required: [] },
  handler: async () => listReps(),
};

export const categories: AgentTool = {
  name: "list_categories",
  description: "Valid product categories for sales reporting filters.",
  parameters: { type: "object", properties: {}, required: [] },
  handler: async () =>
    db.product.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    }),
};

export const agent7Tools: AgentTool[] = [runSalesReport, reps, categories];
