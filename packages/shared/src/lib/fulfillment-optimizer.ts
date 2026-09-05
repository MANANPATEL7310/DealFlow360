export interface OptimizerLine {
  productId: string;
  qty: number;
}

export interface OptimizerWarehouse {
  id: string;
  shippingCostWeight: number;
  stock: Record<string, number>; // productId -> available quantity
}

export interface AllocationSplit {
  warehouseId: string;
  productId: string;
  qty: number;
  shipmentCostMinor: number; // line share of shipment cost
}

export interface AllocationBackorder {
  productId: string;
  qtyOutstanding: number;
}

export interface OptimizerResult {
  splits: AllocationSplit[];
  backorders: AllocationBackorder[];
  estimatedShipmentCount: number;
  estimatedCostMinor: number;
}

export const SHIPMENT_BASE_MINOR = 500; // $5.00 base shipment cost

export function optimizeSplits(
  lines: OptimizerLine[],
  warehouses: OptimizerWarehouse[],
  shipmentBaseMinor: number = SHIPMENT_BASE_MINOR,
): OptimizerResult {
  // Local mutable copy of stock so inputs remain immutable
  const stock = new Map<string, Map<string, number>>();
  for (const w of warehouses) {
    stock.set(w.id, new Map(Object.entries(w.stock)));
  }
  const weightOf = new Map(warehouses.map((w) => [w.id, w.shippingCostWeight]));

  // Consolidate demand per product
  const demand = new Map<string, number>();
  for (const line of lines) {
    demand.set(line.productId, (demand.get(line.productId) ?? 0) + line.qty);
  }

  const usedWarehouses = new Set<string>();
  const alloc = new Map<string, Map<string, number>>(); // warehouseId -> productId -> qty
  const backorders: AllocationBackorder[] = [];

  // Stable sort by productId for deterministic outputs
  for (const productId of [...demand.keys()].sort()) {
    let remaining = demand.get(productId)!;

    // Filter candidate warehouses with available stock for this product
    // Ordered by:
    // (1) Already used warehouses first (minimizing shipment count)
    // (2) Lowest shippingCostWeight (minimizing shipping cost)
    // (3) ID ascending (deterministic tiebreaker)
    const candidates = warehouses
      .filter((w) => (stock.get(w.id)?.get(productId) ?? 0) > 0)
      .sort((a, b) => {
        const au = usedWarehouses.has(a.id) ? 0 : 1;
        const bu = usedWarehouses.has(b.id) ? 0 : 1;
        if (au !== bu) return au - bu;

        const wa = weightOf.get(a.id) ?? 1;
        const wb = weightOf.get(b.id) ?? 1;
        if (wa !== wb) return wa - wb;

        return a.id.localeCompare(b.id);
      });

    for (const w of candidates) {
      if (remaining <= 0) break;
      const avail = stock.get(w.id)?.get(productId) ?? 0;
      if (avail <= 0) continue;

      const take = Math.min(avail, remaining);
      stock.get(w.id)!.set(productId, avail - take);
      remaining -= take;
      usedWarehouses.add(w.id);

      if (!alloc.has(w.id)) alloc.set(w.id, new Map());
      const am = alloc.get(w.id)!;
      am.set(productId, (am.get(productId) ?? 0) + take);
    }

    if (remaining > 0) {
      backorders.push({ productId, qtyOutstanding: remaining });
    }
  }

  // Calculate shipment costs: each used warehouse = 1 shipment group
  const splits: AllocationSplit[] = [];
  let estimatedCostMinor = 0;

  for (const whId of [...alloc.keys()].sort()) {
    const am = alloc.get(whId)!;
    const weight = weightOf.get(whId) ?? 1;
    const shipmentCost = Math.round(shipmentBaseMinor * weight);
    estimatedCostMinor += shipmentCost;

    const totalQty = [...am.values()].reduce((s, q) => s + q, 0);
    const products = [...am.keys()].sort();
    let assigned = 0;

    products.forEach((pid, i) => {
      const qty = am.get(pid)!;
      const share =
        i === products.length - 1
          ? shipmentCost - assigned
          : Math.round(shipmentCost * (qty / totalQty));
      assigned += share;
      splits.push({
        warehouseId: whId,
        productId: pid,
        qty,
        shipmentCostMinor: share,
      });
    });
  }

  return {
    splits,
    backorders,
    estimatedShipmentCount: usedWarehouses.size,
    estimatedCostMinor,
  };
}

export function summarizePlan(
  splits: Array<{ warehouseId: string; shipmentCostMinor: number }>,
) {
  const shipmentCount = new Set(splits.map((s) => s.warehouseId)).size;
  const costMinor = splits.reduce((sum, s) => sum + s.shipmentCostMinor, 0);
  return { shipmentCount, costMinor };
}
