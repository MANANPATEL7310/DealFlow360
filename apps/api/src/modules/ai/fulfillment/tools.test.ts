import { beforeEach, describe, expect, it, vi } from "vitest";
import { proposeOverride } from "./tools.js";
import {
  applyOverride,
  computeSplit,
  simulateSplit,
} from "../../fulfillment/fulfillment.service.js";

vi.mock("../../../lib/settings.js", () => ({
  getSetting: vi.fn(async () => 100),
}));

vi.mock("../../fulfillment/fulfillment.service.js", () => ({
  applyOverride: vi.fn(async () => ({ id: "plan-1", status: "OVERRIDDEN" })),
  computeSplit: vi.fn(async () => ({
    splits: [],
    backorders: [],
    estShipmentCost: 500,
    estShipmentCount: 1,
    feasible: true,
  })),
  getStockLevels: vi.fn(),
  simulateSplit: vi.fn(async () => ({
    splits: [{ warehouseId: "wh-1", productId: "prod-1", qty: 2 }],
    backorders: [],
    estShipmentCost: 550,
    estShipmentCount: 1,
    feasible: true,
  })),
}));

const args = {
  quotationId: "quote-1",
  splits: [{ warehouseId: "wh-1", productId: "prod-1", qty: 2 }],
};

const ctx = {
  actorId: "user-1",
  actorRole: "sales_manager",
  agent: "fulfillment",
  runId: "run-1",
  quotationId: "quote-1",
};

describe("AI fulfillment tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("applies feasible overrides through M7 when inside the cost band", async () => {
    await expect(proposeOverride.handler(args, ctx)).resolves.toMatchObject({
      id: "plan-1",
      status: "OVERRIDDEN",
    });

    expect(computeSplit).toHaveBeenCalledWith("quote-1");
    expect(simulateSplit).toHaveBeenCalledWith("quote-1", args.splits);
    expect(applyOverride).toHaveBeenCalledWith("quote-1", args.splits, {
      actorId: "user-1",
    });
  });

  it("returns a HITL approval request when the override exceeds the cost band", async () => {
    vi.mocked(simulateSplit).mockResolvedValueOnce({
      splits: [
        {
          warehouseId: "wh-1",
          productId: "prod-1",
          qty: 2,
          shipmentCostMinor: 700,
        },
      ],
      backorders: [],
      estShipmentCost: 700,
      estShipmentCount: 1,
      feasible: true,
    });

    await expect(proposeOverride.handler(args, ctx)).resolves.toMatchObject({
      needsApproval: true,
      kind: "FULFILLMENT_OVERRIDE",
      proposedAction: args,
    });
    expect(applyOverride).not.toHaveBeenCalled();
  });

  it("rejects infeasible splits before applying or requesting approval", async () => {
    vi.mocked(simulateSplit).mockResolvedValueOnce({
      splits: [],
      backorders: [{ productId: "prod-1", qty: 2 }],
      estShipmentCost: 0,
      estShipmentCount: 0,
      feasible: false,
    });

    await expect(proposeOverride.handler(args, ctx)).resolves.toEqual({
      error: "INFEASIBLE_SPLIT",
    });
    expect(applyOverride).not.toHaveBeenCalled();
  });
});
