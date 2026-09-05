import type { AgentTool } from "../../../ai/tools/types.js";
import { loadQuotationWithLines } from "../../quotation/quotation.service.js";
import { getUpsellSuggestions } from "../../upsell/upsell.service.js";
import { embed, similar } from "../../../ai/rag.js";

export const getCartLines: AgentTool = {
  name: "get_cart_lines",
  description:
    "The products currently in the quotation (id, name, category, qty).",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args: unknown) => {
    const { quotationId } = (args ?? {}) as { quotationId: string };
    const q = await loadQuotationWithLines(quotationId);
    if (!q) return [];
    return q.lines.map((l) => ({
      productId: l.productId,
      name: l.product?.name ?? "Unknown",
      category: l.product?.category ?? "UNKNOWN",
      qty: l.qty,
    }));
  },
};

export const getUpsellCandidates: AgentTool = {
  name: "get_upsell_candidates",
  description:
    "Deterministic, margin-guardrailed upsell candidates for the quotation (source of truth).",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args: unknown) => {
    const { quotationId } = (args ?? {}) as { quotationId: string };
    return getUpsellSuggestions(quotationId);
  },
};

export const getMarginImpact: AgentTool = {
  name: "get_margin_impact",
  description:
    "Order margin % now, and the delta if a given candidate product were added.",
  parameters: {
    type: "object",
    properties: {
      quotationId: { type: "string" },
      productId: { type: "string" },
    },
    required: ["quotationId", "productId"],
  },
  handler: async (args: unknown) => {
    const { quotationId, productId } = (args ?? {}) as {
      quotationId: string;
      productId: string;
    };
    const cands = (await getUpsellSuggestions(quotationId)) as Array<{
      product: { id: string };
      marginDeltaPct: number;
    }>;
    const hit = cands.find((c) => c.product.id === productId);
    return { marginDeltaPct: hit?.marginDeltaPct ?? null };
  },
};

export const findCoPurchased: AgentTool = {
  name: "find_co_purchased",
  description:
    "Products historically/semantically co-purchased with the cart (RAG, for reasoning only).",
  parameters: {
    type: "object",
    properties: { cartSummary: { type: "string" } },
    required: ["cartSummary"],
  },
  handler: async (args: unknown) => {
    const { cartSummary } = (args ?? {}) as { cartSummary: string };
    try {
      const queryVector = await embed(cartSummary);
      return await similar("PRODUCT", queryVector, 8);
    } catch {
      return [];
    }
  },
};

export const agent2Tools: AgentTool[] = [
  getCartLines,
  getUpsellCandidates,
  getMarginImpact,
  findCoPurchased,
];
