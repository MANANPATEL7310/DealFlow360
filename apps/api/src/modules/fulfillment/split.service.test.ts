import { describe, expect, it } from "vitest";
import { optimizeSplits, type OptimizerWarehouse } from "./split.service.js";

function warehouse(
  id: string,
  shippingCostWeight: number,
  stock: Record<string, number>,
): OptimizerWarehouse {
  return { id, shippingCostWeight, stock };
}

describe("optimizeSplits", () => {
  it("uses a single warehouse when it can cover all demand", () => {
    const result = optimizeSplits(
      [{ productId: "A", qty: 3 }],
      [warehouse("w1", 1, { A: 10 })],
    );

    expect(result).toEqual({
      splits: [
        { warehouseId: "w1", productId: "A", qty: 3, shipmentCostMinor: 500 },
      ],
      backorders: [],
      estimatedShipmentCount: 1,
      estimatedCostMinor: 500,
    });
  });

  it("reuses an already-used warehouse before opening another shipment", () => {
    const result = optimizeSplits(
      [
        { productId: "A", qty: 10 },
        { productId: "B", qty: 5 },
      ],
      [warehouse("w1", 1, { A: 6, B: 5 }), warehouse("w2", 1.5, { A: 10 })],
    );

    expect(result.splits).toEqual([
      { warehouseId: "w1", productId: "A", qty: 6, shipmentCostMinor: 273 },
      { warehouseId: "w1", productId: "B", qty: 5, shipmentCostMinor: 227 },
      { warehouseId: "w2", productId: "A", qty: 4, shipmentCostMinor: 750 },
    ]);
    expect(result.backorders).toEqual([]);
    expect(result.estimatedShipmentCount).toBe(2);
    expect(result.estimatedCostMinor).toBe(1250);
  });

  it("prefers the lowest shipping cost among unused warehouses", () => {
    const result = optimizeSplits(
      [{ productId: "X", qty: 5 }],
      [warehouse("w1", 2, { X: 10 }), warehouse("w2", 1, { X: 10 })],
    );

    expect(result.splits).toEqual([
      { warehouseId: "w2", productId: "X", qty: 5, shipmentCostMinor: 500 },
    ]);
  });

  it("breaks equal-cost ties by warehouse id", () => {
    const result = optimizeSplits(
      [{ productId: "X", qty: 5 }],
      [warehouse("w2", 1, { X: 10 }), warehouse("w1", 1, { X: 10 })],
    );

    expect(result.splits[0]?.warehouseId).toBe("w1");
  });

  it("backorders demand that available stock cannot cover", () => {
    const result = optimizeSplits(
      [{ productId: "X", qty: 20 }],
      [warehouse("w1", 1, { X: 6 }), warehouse("w2", 1, { X: 10 })],
    );

    expect(result.splits.reduce((sum, split) => sum + split.qty, 0)).toBe(16);
    expect(result.backorders).toEqual([{ productId: "X", qtyOutstanding: 4 }]);
    expect(result.estimatedShipmentCount).toBe(2);
  });

  it("allocates shipment cost shares exactly across multiple lines", () => {
    const result = optimizeSplits(
      [
        { productId: "A", qty: 1 },
        { productId: "B", qty: 1 },
        { productId: "C", qty: 1 },
      ],
      [warehouse("w1", 1, { A: 1, B: 1, C: 1 })],
    );

    expect(result.splits.map((split) => split.shipmentCostMinor)).toEqual([
      167, 167, 166,
    ]);
    expect(
      result.splits.reduce((sum, split) => sum + split.shipmentCostMinor, 0),
    ).toBe(500);
    expect(result.estimatedCostMinor).toBe(500);
  });

  it("uses a custom shipment base when provided", () => {
    const result = optimizeSplits(
      [{ productId: "A", qty: 1 }],
      [warehouse("w1", 2, { A: 5 })],
      1000,
    );

    expect(result.estimatedCostMinor).toBe(2000);
  });

  it("is deterministic regardless of input order", () => {
    const warehouses = [
      warehouse("w1", 1, { A: 6, B: 5 }),
      warehouse("w2", 1.5, { A: 10 }),
    ];

    const first = optimizeSplits(
      [
        { productId: "A", qty: 10 },
        { productId: "B", qty: 5 },
      ],
      warehouses,
    );
    const second = optimizeSplits(
      [
        { productId: "B", qty: 5 },
        { productId: "A", qty: 10 },
      ],
      [...warehouses].reverse(),
    );

    expect(second).toEqual(first);
  });

  it("returns an empty plan for no demand", () => {
    expect(optimizeSplits([], [])).toEqual({
      splits: [],
      backorders: [],
      estimatedShipmentCount: 0,
      estimatedCostMinor: 0,
    });
  });

  it("supports backorder consolidation as a fresh optimizer run", () => {
    const result = optimizeSplits(
      [{ productId: "X", qty: 4 }],
      [warehouse("w3", 1, { X: 10 })],
    );

    expect(result.backorders).toEqual([]);
    expect(result.splits).toEqual([
      { warehouseId: "w3", productId: "X", qty: 4, shipmentCostMinor: 500 },
    ]);
  });
});
