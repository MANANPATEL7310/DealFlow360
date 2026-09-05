import { getSetting } from "../../../lib/settings.js";
import { z } from "zod";
import {
  applyOverride,
  computeSplit,
  getStockLevels,
  simulateSplit,
} from "../../fulfillment/fulfillment.service.js";
import { overrideFulfillmentSchema } from "../../fulfillment/fulfillment.schema.js";
import type { AgentTool } from "../../../ai/tools/types.js";

const aiFulfillmentSplitSchema = overrideFulfillmentSchema.extend({
  quotationId: z.string().min(1),
});

const splitParameters = {
  type: "object",
  properties: {
    quotationId: { type: "string" },
    splits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          warehouseId: { type: "string" },
          productId: { type: "string" },
          qty: { type: "number" },
        },
        required: ["warehouseId", "productId", "qty"],
      },
    },
  },
  required: ["quotationId", "splits"],
};

export const getStock: AgentTool = {
  name: "get_stock_levels",
  description:
    "Live per-warehouse stock for the quotation's physical products.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args) => {
    const { quotationId } = args as { quotationId: string };
    return getStockLevels(quotationId);
  },
};

export const computeSplitTool: AgentTool = {
  name: "compute_split",
  description: "Deterministic M7 optimizer split for the quotation.",
  parameters: {
    type: "object",
    properties: { quotationId: { type: "string" } },
    required: ["quotationId"],
  },
  handler: async (args) => {
    const { quotationId } = args as { quotationId: string };
    return computeSplit(quotationId);
  },
};

export const simulateSplitTool: AgentTool = {
  name: "simulate_split",
  description: "Estimate cost and feasibility for a hypothetical split.",
  parameters: splitParameters,
  handler: async (args) => {
    const parsed = aiFulfillmentSplitSchema.parse(args);

    return simulateSplit(parsed.quotationId, parsed.splits);
  },
};

export const proposeOverride: AgentTool = {
  name: "propose_override",
  description:
    "Apply or request approval for a manual fulfillment split override.",
  write: true,
  parameters: splitParameters,
  handler: async (args, ctx) => {
    const parsed = aiFulfillmentSplitSchema.parse(args);

    const baseline = await computeSplit(parsed.quotationId);
    const simulation = await simulateSplit(parsed.quotationId, parsed.splits);
    if (!simulation.feasible) {
      return { error: "INFEASIBLE_SPLIT" };
    }

    const band = await getSetting<number>("fulfillment.overrideCostBand", 0);
    const extraCost = simulation.estShipmentCost - baseline.estShipmentCost;

    if (extraCost > band) {
      return {
        needsApproval: true,
        kind: "FULFILLMENT_OVERRIDE",
        summary: `Override raises shipment cost by ${extraCost} minor units on quote ${parsed.quotationId}`,
        proposedAction: {
          quotationId: parsed.quotationId,
          splits: parsed.splits,
        },
      };
    }

    return applyOverride(parsed.quotationId, parsed.splits, {
      actorId: ctx.actorId,
    });
  },
};

export const agent3Tools: AgentTool[] = [
  getStock,
  computeSplitTool,
  simulateSplitTool,
  proposeOverride,
];
