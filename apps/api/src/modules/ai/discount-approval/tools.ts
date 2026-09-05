import type { AgentTool } from "../../../ai/tools/types.js";
import { getQuotationRisk } from "../../../ai/tools/get-quotation-risk.js";
import { loadCustomerHistory } from "../../customer/customer.service.js";
import { loadDiscountPolicy } from "../../governance/governance.service.js";
import { embed, similar } from "../../../ai/rag.js";
import { redactPII } from "../../../ai/guardrails/redact.js";

export const getCustomerHistoryTool: AgentTool = {
  name: "get_customer_history",
  description:
    "Aggregate discount behavior + tier for the quotation's customer (strictly non-PII).",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  write: false,
  handler: async (rawArgs: unknown, ctx) => {
    const args = rawArgs as { quotationId?: string } | undefined;
    const quotationId = args?.quotationId || ctx.quotationId;
    const h = await loadCustomerHistory({ quotationId });
    return {
      tier: h.tier,
      avgDiscountPct: h.avgDiscountPct,
      dealCount: h.dealCount,
      wonRate: h.wonRate,
    };
  },
};

export const findSimilarApprovedQuotesTool: AgentTool = {
  name: "find_similar_approved_quotes",
  description:
    "Retrieve past CONFIRMED/approved quotations similar to this one (RAG).",
  parameters: {
    type: "object",
    properties: { summary: { type: "string" } },
    required: ["summary"],
  },
  write: false,
  handler: async (rawArgs: unknown) => {
    const args = rawArgs as { summary?: string } | undefined;
    try {
      const v = await embed(redactPII(args?.summary || ""));
      return await similar("QUOTATION", v, 5);
    } catch {
      // If embeddings/pgvector not populated or available, degrade gracefully
      return [];
    }
  },
};

export const getDiscountPolicyTool: AgentTool = {
  name: "get_discount_policy",
  description:
    "The tier ceiling, category ceilings, and approval-chain thresholds that apply.",
  parameters: {
    type: "object",
    properties: { tier: { type: "string" } },
    required: ["tier"],
  },
  write: false,
  handler: async (rawArgs: unknown) => {
    const args = rawArgs as { tier?: string } | undefined;
    return loadDiscountPolicy(args?.tier);
  },
};

export const agent1Tools: AgentTool[] = [
  getQuotationRisk,
  getCustomerHistoryTool,
  findSimilarApprovedQuotesTool,
  getDiscountPolicyTool,
];
