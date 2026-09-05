import type { AgentTool } from "../../../ai/tools/types.js";
import {
  loadNegotiationRequest,
  hypotheticalAcceptedLines,
} from "../../portal/portal.service.js";
import { loadRiskConfig } from "../../discount/risk-config.js";
import { loadApprovalRules } from "../../governance/governance.service.js";
import { computeBlendedRisk } from "../../discount/risk-engine.js";
import { resolveRequiredLevels } from "../../discount/routing.service.js";
import { toRiskLine } from "../../quotation/quotation.service.js";
import { loadCustomerHistory } from "../../customer/customer.service.js";

// READ — customer counter request + line context
export const getNegotiationRequestTool: AgentTool = {
  name: "get_negotiation_request",
  description:
    "Load the customer's negotiation counter and the affected quotation lines (non-PII).",
  parameters: {
    type: "object",
    properties: { requestId: { type: "string" } },
    required: ["requestId"],
  },
  write: false,
  handler: async (rawArgs: unknown, ctx) => {
    const args = rawArgs as { requestId?: string } | undefined;
    const requestId = args?.requestId || ctx.quotationId;
    if (!requestId) throw new Error("Missing requestId");
    return loadNegotiationRequest(requestId);
  },
};

// READ — in-memory hypothetical risk check. Persists NOTHING.
export const evaluateCounterTool: AgentTool = {
  name: "evaluate_counter",
  description:
    "Compute blended risk + required approval levels IF the customer's counter were accepted.",
  parameters: {
    type: "object",
    properties: { requestId: { type: "string" } },
    required: ["requestId"],
  },
  write: false,
  handler: async (rawArgs: unknown, ctx) => {
    const args = rawArgs as { requestId?: string } | undefined;
    const requestId = args?.requestId || ctx.quotationId;
    if (!requestId) throw new Error("Missing requestId");
    const { lines, tier } = await hypotheticalAcceptedLines(requestId);
    const cfg = await loadRiskConfig(tier);
    const chain = await loadApprovalRules();
    const risk = computeBlendedRisk(lines.map(toRiskLine), cfg);
    const requiredLevels = resolveRequiredLevels(risk, cfg, chain);

    return {
      blendedScore: risk.blendedScore,
      worstLineViolationPct: risk.worstLineViolationPct,
      requiredLevels,
      wouldAutoApprove: requiredLevels.length === 0,
    };
  },
};

// READ — aggregate customer discount behavior (no PII)
export const getCustomerHistoryTool: AgentTool = {
  name: "get_customer_history",
  description:
    "Aggregate customer context (tier, avg discount, win rate) — no PII.",
  parameters: {
    type: "object",
    properties: { requestId: { type: "string" } },
    required: ["requestId"],
  },
  write: false,
  handler: async (rawArgs: unknown, ctx) => {
    const args = rawArgs as { requestId?: string } | undefined;
    const requestId = args?.requestId || ctx.quotationId;
    const h = await loadCustomerHistory({ requestId });
    return {
      tier: h.tier,
      avgDiscountPct: h.avgDiscountPct,
      dealCount: h.dealCount,
      wonRate: h.wonRate,
    };
  },
};

// WRITE (outward-facing) — DRAFT ONLY. Never posts directly. Always requires rep approval.
export const draftResponseTool: AgentTool = {
  name: "draft_response",
  description:
    "Prepare a draft reply to the customer's counter for the REP to review. Does not send.",
  write: true,
  parameters: {
    type: "object",
    properties: {
      requestId: { type: "string" },
      draftMessage: { type: "string" },
      recommendedCounterPct: { type: "number" },
    },
    required: ["requestId", "draftMessage"],
  },
  handler: async (rawArgs: unknown, _ctx) => {
    const args = rawArgs as {
      requestId: string;
      draftMessage: string;
      recommendedCounterPct?: number;
    };
    return {
      needsApproval: true,
      kind: "NEGOTIATION" as const,
      summary: `Draft reply to customer counter on request ${args.requestId}`,
      proposedAction: {
        requestId: args.requestId,
        draftMessage: args.draftMessage,
        recommendedCounterPct: args.recommendedCounterPct ?? null,
      },
    };
  },
};

export const agent6Tools: AgentTool[] = [
  getNegotiationRequestTool,
  evaluateCounterTool,
  getCustomerHistoryTool,
  draftResponseTool,
];
