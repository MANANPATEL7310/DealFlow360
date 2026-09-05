import {
  apiRoutes,
  type FulfillmentPlan,
  type FulfillmentSplit,
  type ManualSplitInput,
  optimizeSplits,
  type OptimizerWarehouse,
  SEED_FULFILLMENT_PLANS,
  SEED_STOCK_LEVELS,
  SEED_WAREHOUSES,
  type StockLevel,
  type Warehouse,
} from "@template/shared";
import { quotationsApi } from "@/features/quotations/api/quotations-api";
import { apiClient } from "@/services/http/api-client";

let localPlans: FulfillmentPlan[] = [...SEED_FULFILLMENT_PLANS];
const localStock: StockLevel[] = [...SEED_STOCK_LEVELS];

export const fulfillmentApi = {
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const { data } = await apiClient.get(apiRoutes.warehouses.list.path);
      return data.data;
    } catch {
      return SEED_WAREHOUSES;
    }
  },

  async getStockLevels(): Promise<StockLevel[]> {
    return localStock;
  },

  async getPlan(quotationId: string): Promise<FulfillmentPlan> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.fulfillment.get.path.replace(":id", quotationId),
      );
      return data.data;
    } catch {
      const existing = localPlans.find((p) => p.quotationId === quotationId);
      if (existing) {
        return existing;
      }

      const quotation = await quotationsApi.getQuotationById(quotationId);
      if (!quotation) {
        throw new Error("Quotation not found");
      }

      // Filter hardware lines that require physical shipment
      const hardwareLines = quotation.lines
        .filter((l) => l.product?.category === "HARDWARE" || !l.product)
        .map((l) => ({
          productId: l.productId,
          qty: l.qty,
        }));

      // Assemble warehouse inventory maps for the optimizer
      const optimizerWarehouses: OptimizerWarehouse[] = SEED_WAREHOUSES.map(
        (w) => {
          const stockMap: Record<string, number> = {};
          const levels = localStock.filter((s) => s.warehouseId === w.id);
          for (const s of levels) {
            stockMap[s.productId] = s.quantity;
          }
          return {
            id: w.id,
            shippingCostWeight: w.shippingCostWeight,
            stock: stockMap,
          };
        },
      );

      const result = optimizeSplits(hardwareLines, optimizerWarehouses);

      const newPlan: FulfillmentPlan = {
        id: `flp-${Date.now()}`,
        quotationId,
        status: "SUGGESTED",
        splits: result.splits.map((s, idx) => ({
          id: `fls-${Date.now()}-${idx}`,
          planId: `flp-${Date.now()}`,
          warehouseId: s.warehouseId,
          productId: s.productId,
          qty: s.qty,
          shipmentCostMinor: s.shipmentCostMinor,
          createdAt: new Date().toISOString(),
        })),
        backorders: result.backorders.map((b, idx) => ({
          id: `bko-${Date.now()}-${idx}`,
          planId: `flp-${Date.now()}`,
          productId: b.productId,
          qtyOutstanding: b.qtyOutstanding,
          createdAt: new Date().toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      localPlans = [newPlan, ...localPlans];
      return newPlan;
    }
  },

  async acceptPlan(quotationId: string): Promise<FulfillmentPlan> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.fulfillment.accept.path.replace(":id", quotationId),
      );
      return data.data;
    } catch {
      const plan = await this.getPlan(quotationId);
      plan.status = "ACCEPTED";
      plan.updatedAt = new Date().toISOString();

      // Decrement allocated stock from inventory
      for (const split of plan.splits) {
        const item = localStock.find(
          (s) =>
            s.warehouseId === split.warehouseId &&
            s.productId === split.productId,
        );
        if (item) {
          item.quantity = Math.max(0, item.quantity - split.qty);
        }
      }

      return plan;
    }
  },

  async overridePlan(
    quotationId: string,
    splits: ManualSplitInput[],
  ): Promise<FulfillmentPlan> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.fulfillment.override.path.replace(":id", quotationId),
        { splits },
      );
      return data.data;
    } catch {
      const plan = await this.getPlan(quotationId);
      const warehouses = SEED_WAREHOUSES;

      // Recompute proportional shipment cost shares for each warehouse group
      const byWh = new Map<string, ManualSplitInput[]>();
      for (const s of splits) {
        const list = byWh.get(s.warehouseId) ?? [];
        list.push(s);
        byWh.set(s.warehouseId, list);
      }

      const newSplits: FulfillmentSplit[] = [];
      for (const [whId, items] of byWh.entries()) {
        const wh = warehouses.find((w) => w.id === whId);
        const weight = wh?.shippingCostWeight ?? 1.0;
        const shipmentCost = Math.round(500 * weight);
        const totalQty = items.reduce((acc, i) => acc + i.qty, 0);

        let assigned = 0;
        items.forEach((item, idx) => {
          const share =
            idx === items.length - 1
              ? shipmentCost - assigned
              : Math.round(shipmentCost * (item.qty / totalQty));
          assigned += share;

          newSplits.push({
            id: `fls-${Date.now()}-${idx}`,
            planId: plan.id,
            warehouseId: whId,
            productId: item.productId,
            qty: item.qty,
            shipmentCostMinor: share,
            createdAt: new Date().toISOString(),
          });
        });
      }

      plan.splits = newSplits;
      plan.status = "OVERRIDDEN";
      plan.updatedAt = new Date().toISOString();
      return plan;
    }
  },

  async consolidateBackorder(
    quotationId: string,
    backorderId: string,
  ): Promise<FulfillmentPlan> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.fulfillment.consolidate.path
          .replace(":id", quotationId)
          .replace(":backorderId", backorderId),
      );
      return data.data;
    } catch {
      const plan = await this.getPlan(quotationId);
      const backorder = plan.backorders.find((b) => b.id === backorderId);
      if (backorder) {
        backorder.consolidatedAt = new Date().toISOString();
        // Add consolidated split to primary warehouse
        plan.splits.push({
          id: `fls-cons-${Date.now()}`,
          planId: plan.id,
          warehouseId: "wh-01",
          productId: backorder.productId,
          qty: backorder.qtyOutstanding,
          shipmentCostMinor: 500,
          createdAt: new Date().toISOString(),
        });
        backorder.qtyOutstanding = 0;
      }
      return plan;
    }
  },
};
