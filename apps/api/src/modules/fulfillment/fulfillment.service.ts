import type { Prisma, QuotationStatus } from "@prisma/client";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { transition } from "../quotation/lifecycle.js";
import {
  getQuotation,
  loadQuotationWithLines,
} from "../quotation/quotation.service.js";
import {
  optimizeSplits,
  SHIPMENT_BASE_MINOR,
  type AllocationSplit,
  type OptimizerLine,
  type OptimizerWarehouse,
} from "./split.service.js";
import type { OverrideFulfillmentInput } from "./fulfillment.schema.js";

type Actor = { id: string; role: string };
type Tx = Prisma.TransactionClient;

function notFound(code: string) {
  return Object.assign(new Error(code), { http: 404 });
}

function conflict(code: string) {
  return Object.assign(new Error(code), { http: 409 });
}

function invalid(code: string) {
  return Object.assign(new Error(code), { http: 422 });
}

async function loadWarehouses(
  productIds: string[],
): Promise<OptimizerWarehouse[]> {
  const warehouses = await db.warehouse.findMany({
    include: {
      stock: {
        where: {
          productId: { in: productIds },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return warehouses.map((warehouse) => ({
    id: warehouse.id,
    shippingCostWeight: warehouse.shippingCostWeight,
    stock: Object.fromEntries(
      warehouse.stock.map((stock) => [stock.productId, stock.quantity]),
    ),
  }));
}

function physicalLines(
  quotation: NonNullable<Awaited<ReturnType<typeof loadQuotationWithLines>>>,
): OptimizerLine[] {
  return quotation.lines
    .filter((line) => line.lineType === "ONE_TIME")
    .map((line) => ({ productId: line.productId, qty: line.qty }));
}

function demandKey(lines: OptimizerLine[]): string {
  return [...lines]
    .sort((a, b) => a.productId.localeCompare(b.productId))
    .map((line) => `${line.productId}:${line.qty}`)
    .join("|");
}

function assertCoversDemand(
  splits: OverrideFulfillmentInput["splits"],
  lines: OptimizerLine[],
) {
  const expected = new Map<string, number>();
  const actual = new Map<string, number>();

  for (const line of lines) {
    expected.set(
      line.productId,
      (expected.get(line.productId) ?? 0) + line.qty,
    );
  }
  for (const split of splits) {
    actual.set(split.productId, (actual.get(split.productId) ?? 0) + split.qty);
  }

  if (
    demandKey([...expected].map(([productId, qty]) => ({ productId, qty }))) !==
    demandKey([...actual].map(([productId, qty]) => ({ productId, qty })))
  ) {
    throw invalid("INVALID_OVERRIDE");
  }
}

async function priceManualSplits(
  tx: Tx,
  splits: OverrideFulfillmentInput["splits"],
): Promise<AllocationSplit[]> {
  const warehouseIds = [...new Set(splits.map((split) => split.warehouseId))];
  const warehouses = await tx.warehouse.findMany({
    where: { id: { in: warehouseIds } },
    select: { id: true, shippingCostWeight: true },
  });
  const weightByWarehouse = new Map(
    warehouses.map((warehouse) => [warehouse.id, warehouse.shippingCostWeight]),
  );
  const grouped = new Map<string, OverrideFulfillmentInput["splits"]>();

  for (const split of splits) {
    if (!weightByWarehouse.has(split.warehouseId)) {
      throw notFound("WAREHOUSE_NOT_FOUND");
    }
    grouped.set(split.warehouseId, [
      ...(grouped.get(split.warehouseId) ?? []),
      split,
    ]);
  }

  const priced: AllocationSplit[] = [];
  for (const [warehouseId, warehouseSplits] of [...grouped].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const shipmentCostMinor = Math.round(
      SHIPMENT_BASE_MINOR * (weightByWarehouse.get(warehouseId) ?? 0),
    );
    const totalQuantity = warehouseSplits.reduce(
      (sum, split) => sum + split.qty,
      0,
    );
    const sortedSplits = [...warehouseSplits].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );
    let assignedCostMinor = 0;

    sortedSplits.forEach((split, index) => {
      const isLast = index === sortedSplits.length - 1;
      const shipmentCostShare = isLast
        ? shipmentCostMinor - assignedCostMinor
        : Math.round(shipmentCostMinor * (split.qty / totalQuantity));
      assignedCostMinor += shipmentCostShare;

      priced.push({
        warehouseId,
        productId: split.productId,
        qty: split.qty,
        shipmentCostMinor: shipmentCostShare,
      });
    });
  }

  return priced;
}

async function assertStockAvailable(
  tx: Tx,
  splits: Pick<AllocationSplit, "warehouseId" | "productId" | "qty">[],
) {
  for (const split of splits) {
    const row = await tx.stockLevel.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: split.warehouseId,
          productId: split.productId,
        },
      },
    });

    if (!row || row.quantity < split.qty) {
      throw conflict("INSUFFICIENT_STOCK");
    }
  }
}

async function decrementStock(
  tx: Tx,
  splits: Pick<AllocationSplit, "warehouseId" | "productId" | "qty">[],
) {
  for (const split of splits) {
    await tx.stockLevel.update({
      where: {
        warehouseId_productId: {
          warehouseId: split.warehouseId,
          productId: split.productId,
        },
      },
      data: { quantity: { decrement: split.qty } },
    });
  }
}

export async function getFulfillmentPlan(quotationId: string, actor: Actor) {
  await getQuotation(quotationId, actor);

  return db.fulfillmentPlan.findUnique({
    where: { quotationId },
    include: {
      splits: { include: { warehouse: true, product: true } },
      backorders: { include: { product: true } },
    },
  });
}

export async function moveToFulfillment(quotationId: string, actorId: string) {
  const quotation = await loadQuotationWithLines(quotationId);
  if (!quotation) {
    throw notFound("QUOTATION_NOT_FOUND");
  }

  await transition(
    { id: quotation.id, status: quotation.status as QuotationStatus },
    "FULFILLMENT",
    actorId,
    "Entering fulfillment",
  );

  return generateFulfillmentPlan(quotationId);
}

export async function generateFulfillmentPlan(quotationId: string) {
  const existing = await db.fulfillmentPlan.findUnique({
    where: { quotationId },
  });
  if (existing && existing.status !== "SUGGESTED") {
    return getFulfillmentPlan(quotationId, { id: "", role: "admin" });
  }

  const quotation = await loadQuotationWithLines(quotationId);
  if (!quotation) {
    throw notFound("QUOTATION_NOT_FOUND");
  }

  const lines = physicalLines(quotation);
  const warehouses = await loadWarehouses(lines.map((line) => line.productId));
  const result = optimizeSplits(lines, warehouses);

  return db.$transaction(async (tx) => {
    if (existing) {
      await tx.fulfillmentSplit.deleteMany({ where: { planId: existing.id } });
      await tx.backorder.deleteMany({ where: { planId: existing.id } });
    }

    const plan = existing
      ? await tx.fulfillmentPlan.update({
          where: { id: existing.id },
          data: { status: "SUGGESTED" },
        })
      : await tx.fulfillmentPlan.create({
          data: { quotationId, status: "SUGGESTED" },
        });

    if (result.splits.length > 0) {
      await tx.fulfillmentSplit.createMany({
        data: result.splits.map((split) => ({ planId: plan.id, ...split })),
      });
    }
    if (result.backorders.length > 0) {
      await tx.backorder.createMany({
        data: result.backorders.map((backorder) => ({
          planId: plan.id,
          productId: backorder.productId,
          qtyOutstanding: backorder.qtyOutstanding,
        })),
      });
    }

    return tx.fulfillmentPlan.findUniqueOrThrow({
      where: { id: plan.id },
      include: {
        splits: { include: { warehouse: true, product: true } },
        backorders: { include: { product: true } },
      },
    });
  });
}

export async function acceptPlan(quotationId: string, actorId: string) {
  const plan = await db.fulfillmentPlan.findUnique({
    where: { quotationId },
    include: { splits: true },
  });
  if (!plan) {
    throw notFound("PLAN_NOT_FOUND");
  }
  if (plan.status !== "SUGGESTED") {
    throw conflict("PLAN_NOT_SUGGESTED");
  }

  return db.$transaction(async (tx) => {
    await assertStockAvailable(tx, plan.splits);
    await decrementStock(tx, plan.splits);

    const updated = await tx.fulfillmentPlan.update({
      where: { id: plan.id },
      data: { status: "ACCEPTED" },
      include: {
        splits: { include: { warehouse: true, product: true } },
        backorders: { include: { product: true } },
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "fulfillment.accepted",
      entity: "FulfillmentPlan",
      entityId: plan.id,
      diff: { quotationId },
    });

    return updated;
  });
}

export async function overridePlan(
  quotationId: string,
  actorId: string,
  input: OverrideFulfillmentInput,
) {
  const plan = await db.fulfillmentPlan.findUnique({
    where: { quotationId },
    include: { splits: true },
  });
  if (!plan) {
    throw notFound("PLAN_NOT_FOUND");
  }
  if (plan.status === "ACCEPTED") {
    throw conflict("PLAN_NOT_SUGGESTED");
  }

  const quotation = await loadQuotationWithLines(quotationId);
  if (!quotation) {
    throw notFound("QUOTATION_NOT_FOUND");
  }
  assertCoversDemand(input.splits, physicalLines(quotation));

  return db.$transaction(async (tx) => {
    await assertStockAvailable(tx, input.splits);
    const priced = await priceManualSplits(tx, input.splits);

    await tx.fulfillmentSplit.deleteMany({ where: { planId: plan.id } });
    await tx.backorder.deleteMany({ where: { planId: plan.id } });
    await tx.fulfillmentSplit.createMany({
      data: priced.map((split) => ({ planId: plan.id, ...split })),
    });
    await decrementStock(tx, input.splits);

    const updated = await tx.fulfillmentPlan.update({
      where: { id: plan.id },
      data: { status: "OVERRIDDEN" },
      include: {
        splits: { include: { warehouse: true, product: true } },
        backorders: { include: { product: true } },
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "fulfillment.overridden",
      entity: "FulfillmentPlan",
      entityId: plan.id,
      diff: { quotationId },
    });

    return updated;
  });
}

export async function consolidateBackorder(
  quotationId: string,
  backorderId: string,
  actorId: string,
) {
  const backorder = await db.backorder.findUnique({
    where: { id: backorderId },
    include: { plan: true },
  });
  if (!backorder || backorder.plan.quotationId !== quotationId) {
    throw notFound("BACKORDER_NOT_FOUND");
  }
  if (backorder.consolidatedAt) {
    throw conflict("BACKORDER_ALREADY_CONSOLIDATED");
  }

  const warehouses = await loadWarehouses([backorder.productId]);
  const result = optimizeSplits(
    [{ productId: backorder.productId, qty: backorder.qtyOutstanding }],
    warehouses,
  );
  const covered = result.splits.reduce((sum, split) => sum + split.qty, 0);
  const remaining = backorder.qtyOutstanding - covered;

  return db.$transaction(async (tx) => {
    await assertStockAvailable(tx, result.splits);
    if (result.splits.length > 0) {
      await tx.fulfillmentSplit.createMany({
        data: result.splits.map((split) => ({
          planId: backorder.planId,
          ...split,
        })),
      });
      await decrementStock(tx, result.splits);
    }

    const updated = await tx.backorder.update({
      where: { id: backorder.id },
      data:
        remaining > 0
          ? { qtyOutstanding: remaining }
          : { qtyOutstanding: 0, consolidatedAt: new Date() },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "backorder.consolidated",
      entity: "Backorder",
      entityId: backorder.id,
      diff: { quotationId, covered, remaining },
    });

    return updated;
  });
}
