import type { AgentTool } from "./types.js";
import {
  loadQuotationWithLines,
  toRiskLine,
} from "../../modules/quotation/quotation.service.js";
import { loadRiskConfig } from "../../modules/discount/risk-config.js";
import { computeBlendedRisk } from "../../modules/discount/risk-engine.js";

export const getQuotationRisk: AgentTool = {
  name: "get_quotation_risk",
  description: "Compute the blended discount risk breakdown for a quotation.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  write: false,
  handler: async (rawArgs, ctx) => {
    const args = rawArgs as { quotationId?: string };
    const qId = args?.quotationId || ctx.quotationId;
    if (!qId) {
      throw new Error("Missing quotationId for get_quotation_risk");
    }
    const q = await loadQuotationWithLines(qId);
    if (!q) {
      throw new Error(`Quotation not found: ${qId}`);
    }
    const cfg = await loadRiskConfig(q.customer.tier);
    return computeBlendedRisk(q.lines.map(toRiskLine), cfg);
  },
};
