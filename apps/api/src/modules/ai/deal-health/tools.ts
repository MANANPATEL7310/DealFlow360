import type { AgentTool } from "../../../ai/tools/types.js";
import {
  getOpenAlerts,
  getQuotationTimeline,
  getRepStats,
} from "../../deal-health/deal-health.service.js";

export const openAlerts: AgentTool = {
  name: "get_open_alerts",
  description: "Current open deterministic deal-health alerts from M10.",
  parameters: { type: "object", properties: {}, required: [] },
  handler: async () => getOpenAlerts(),
};

export const timeline: AgentTool = {
  name: "get_quotation_timeline",
  description: "Status events and activity dates for one quotation.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args) => {
    const { quotationId } = args as { quotationId: string };
    return getQuotationTimeline(quotationId);
  },
};

export const repStats: AgentTool = {
  name: "get_rep_stats",
  description: "Owning rep load and paid-rate context for prioritization.",
  parameters: {
    type: "object",
    properties: { repId: { type: "string" } },
    required: ["repId"],
  },
  handler: async (args) => {
    const { repId } = args as { repId: string };
    return getRepStats(repId);
  },
};

export const draftNudge: AgentTool = {
  name: "draft_nudge",
  description: "Draft a nudge for the owning rep to approve. Does not send.",
  write: true,
  parameters: {
    type: "object",
    properties: {
      alertId: { type: "string" },
      quotationId: { type: "string" },
      channel: { type: "string", enum: ["CUSTOMER_EMAIL", "INTERNAL"] },
      message: { type: "string" },
    },
    required: ["alertId", "quotationId", "message"],
  },
  handler: async (args) => {
    const input = args as {
      alertId: string;
      quotationId: string;
      channel?: "CUSTOMER_EMAIL" | "INTERNAL";
      message: string;
    };

    return {
      needsApproval: true,
      kind: "NUDGE",
      summary: `Nudge for alert ${input.alertId} on quote ${input.quotationId}`,
      proposedAction: {
        alertId: input.alertId,
        quotationId: input.quotationId,
        channel: input.channel ?? "CUSTOMER_EMAIL",
        message: input.message,
      },
    };
  },
};

export const agent5Tools: AgentTool[] = [
  openAlerts,
  timeline,
  repStats,
  draftNudge,
];
