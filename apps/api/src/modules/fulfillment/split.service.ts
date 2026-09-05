export interface OptimizerLine {
  productId: string;
  qty: number;
}

export interface OptimizerWarehouse {
  id: string;
  shippingCostWeight: number;
  stock: Record<string, number>;
}

export interface AllocationSplit {
  warehouseId: string;
  productId: string;
  qty: number;
  shipmentCostMinor: number;
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

export const SHIPMENT_BASE_MINOR = 500;

export function optimizeSplits(
  lines: OptimizerLine[],
  warehouses: OptimizerWarehouse[],
  shipmentBaseMinor: number = SHIPMENT_BASE_MINOR,
): OptimizerResult {
  const stock = new Map<string, Map<string, number>>();
  const weightByWarehouse = new Map<string, number>();

  for (const warehouse of warehouses) {
    stock.set(warehouse.id, new Map(Object.entries(warehouse.stock)));
    weightByWarehouse.set(warehouse.id, warehouse.shippingCostWeight);
  }

  const demandByProduct = new Map<string, number>();
  for (const line of lines) {
    if (line.qty <= 0) {
      continue;
    }

    demandByProduct.set(
      line.productId,
      (demandByProduct.get(line.productId) ?? 0) + line.qty,
    );
  }

  const usedWarehouses = new Set<string>();
  const allocations = new Map<string, Map<string, number>>();
  const backorders: AllocationBackorder[] = [];

  for (const productId of [...demandByProduct.keys()].sort()) {
    let remaining = demandByProduct.get(productId) ?? 0;

    const candidates = warehouses
      .filter((warehouse) => (stock.get(warehouse.id)?.get(productId) ?? 0) > 0)
      .sort((a, b) => {
        const usedA = usedWarehouses.has(a.id) ? 0 : 1;
        const usedB = usedWarehouses.has(b.id) ? 0 : 1;
        if (usedA !== usedB) return usedA - usedB;

        const weightA = weightByWarehouse.get(a.id) ?? 0;
        const weightB = weightByWarehouse.get(b.id) ?? 0;
        if (weightA !== weightB) return weightA - weightB;

        return a.id.localeCompare(b.id);
      });

    for (const warehouse of candidates) {
      if (remaining <= 0) {
        break;
      }

      const warehouseStock = stock.get(warehouse.id);
      const available = warehouseStock?.get(productId) ?? 0;
      if (!warehouseStock || available <= 0) {
        continue;
      }

      const quantity = Math.min(available, remaining);
      warehouseStock.set(productId, available - quantity);
      remaining -= quantity;
      usedWarehouses.add(warehouse.id);

      const warehouseAllocations =
        allocations.get(warehouse.id) ?? new Map<string, number>();
      warehouseAllocations.set(
        productId,
        (warehouseAllocations.get(productId) ?? 0) + quantity,
      );
      allocations.set(warehouse.id, warehouseAllocations);
    }

    if (remaining > 0) {
      backorders.push({ productId, qtyOutstanding: remaining });
    }
  }

  const splits: AllocationSplit[] = [];
  let estimatedCostMinor = 0;

  for (const warehouseId of [...allocations.keys()].sort()) {
    const warehouseAllocations = allocations.get(warehouseId);
    if (!warehouseAllocations) {
      continue;
    }

    const shipmentCostMinor = Math.round(
      shipmentBaseMinor * (weightByWarehouse.get(warehouseId) ?? 0),
    );
    estimatedCostMinor += shipmentCostMinor;

    const products = [...warehouseAllocations.keys()].sort();
    const totalQuantity = [...warehouseAllocations.values()].reduce(
      (sum, quantity) => sum + quantity,
      0,
    );
    let assignedCostMinor = 0;

    products.forEach((productId, index) => {
      const quantity = warehouseAllocations.get(productId) ?? 0;
      const isLast = index === products.length - 1;
      const costShareMinor = isLast
        ? shipmentCostMinor - assignedCostMinor
        : Math.round(shipmentCostMinor * (quantity / totalQuantity));

      assignedCostMinor += costShareMinor;
      splits.push({
        warehouseId,
        productId,
        qty: quantity,
        shipmentCostMinor: costShareMinor,
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
