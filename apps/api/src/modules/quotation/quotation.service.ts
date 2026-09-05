// apps/api/src/modules/quotation/quotation.service.ts
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { orderMarginPct } from "../../lib/margin.js";
import { loadRiskConfig } from "../discount/risk-config.js";
import { computeBlendedRisk } from "../discount/risk-engine.js";
import { resolveRequiredLevels } from "../discount/routing.service.js";
import { resolveUnitPrice } from "../product/pricing.service.js";
import { assertTransition, recordEvent, transition } from "./lifecycle.js";
import type {
  AddLineInput,
  CreateQuotationInput,
  UpdateLineInput,
} from "./quotation.schema.js";

export type DbClient =
  | typeof db
  | Parameters<Parameters<typeof db.$transaction>[0]>[0];

export function loadQuotationWithLines(
  id: string,
  options?: {
    prisma?: DbClient;
    includeNegotiations?: boolean;
  },
) {
  const client = options?.prisma ?? db;
  return client.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
          variant: true,
        },
        orderBy: { createdAt: "asc" },
      },
      approvals: {
        orderBy: { sequence: "asc" },
      },
      statusEvents: {
        orderBy: { createdAt: "asc" },
      },
      ...(options?.includeNegotiations
        ? {
            negotiations: {
              orderBy: { createdAt: "asc" },
            },
          }
        : {}),
    },
  });
}

function assertOwnership(
  q: { salesRepId: string },
  actor: { id: string; role: string },
) {
  if (actor.role === "sales_rep" && q.salesRepId !== actor.id) {
    throw Object.assign(new Error("NOT_OWNER"), { http: 403 });
  }
}

function assertEditable(status: string) {
  if (status !== "DRAFT" && status !== "UNDER_NEGOTIATION") {
    throw Object.assign(
      new Error(
        "Quotation is locked and cannot be edited in its current status.",
      ),
      { http: 409 },
    );
  }
}

export const toRiskLine = (l: {
  product: { category: string };
  discountPct: number;
  qty: number;
  unitPriceMinor: number;
}) => ({
  category: l.product.category,
  appliedDiscountPct: l.discountPct,
  lineSubtotalMinor: l.qty * l.unitPriceMinor,
});

export async function listQuotations(
  filters: { status?: string; customerId?: string },
  actor: { id: string; role: string },
) {
  const where: Record<string, unknown> = {};

  if (actor.role === "sales_rep") {
    where.salesRepId = actor.id;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  return db.quotation.findMany({
    where,
    include: {
      customer: {
        select: { id: true, name: true, tier: true, currency: true },
      },
      _count: { select: { lines: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getQuotation(
  id: string,
  actor: { id: string; role: string },
) {
  const q = await loadQuotationWithLines(id);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  assertOwnership(q, actor);
  return q;
}

export async function createQuotation(
  input: CreateQuotationInput,
  actorId: string,
) {
  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
  });
  if (!customer) {
    throw Object.assign(new Error("CUSTOMER_NOT_FOUND"), { http: 404 });
  }

  const q = await db.quotation.create({
    data: {
      customerId: input.customerId,
      salesRepId: actorId,
      status: "DRAFT",
    },
    include: { customer: true },
  });

  await writeAudit({
    actorId,
    actorKind: "user",
    action: "quotation.created",
    entity: "Quotation",
    entityId: q.id,
    diff: { customerId: input.customerId },
  });

  return q;
}

export async function addLine(
  quotationId: string,
  input: AddLineInput,
  actor: { id: string; role: string },
) {
  const q = await db.quotation.findUnique({
    where: { id: quotationId },
    include: { customer: true },
  });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  assertOwnership(q, actor);
  assertEditable(q.status);

  const product = await db.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) {
    throw Object.assign(new Error("PRODUCT_NOT_FOUND"), { http: 404 });
  }

  const unitPriceMinor = await resolveUnitPrice({
    productId: input.productId,
    variantId: input.variantId,
    customerTier: q.customer.tier,
    currency: q.customer.currency,
  });

  const line = await db.quotationLine.create({
    data: {
      quotationId,
      productId: input.productId,
      variantId: input.variantId ?? null,
      qty: input.qty,
      unitPriceMinor,
      unitCostMinor: product.unitCost, // snapshot unit cost for profit margin
      discountPct: input.discountPct,
      lineType: input.lineType,
      subscriptionPlanId:
        input.lineType === "RECURRING"
          ? (input.subscriptionPlanId ?? null)
          : null,
    },
  });

  await recomputeTotals(quotationId);

  await writeAudit({
    actorId: actor.id,
    actorKind: "user",
    action: "quotation.line_added",
    entity: "QuotationLine",
    entityId: line.id,
    diff: input,
  });

  return line;
}

export async function updateLine(
  quotationId: string,
  lineId: string,
  input: UpdateLineInput,
  actor: { id: string; role: string },
) {
  const q = await db.quotation.findUnique({ where: { id: quotationId } });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  assertOwnership(q, actor);
  assertEditable(q.status);

  const existingLine = await db.quotationLine.findUnique({
    where: { id: lineId },
  });
  if (!existingLine || existingLine.quotationId !== quotationId) {
    throw Object.assign(new Error("LINE_NOT_FOUND"), { http: 404 });
  }

  const line = await db.quotationLine.update({
    where: { id: lineId },
    data: {
      ...(input.qty !== undefined && { qty: input.qty }),
      ...(input.discountPct !== undefined && {
        discountPct: input.discountPct,
      }),
    },
  });

  await recomputeTotals(quotationId);

  await writeAudit({
    actorId: actor.id,
    actorKind: "user",
    action: "quotation.line_updated",
    entity: "QuotationLine",
    entityId: lineId,
    diff: input,
  });

  return line;
}

export async function deleteLine(
  quotationId: string,
  lineId: string,
  actor: { id: string; role: string },
) {
  const q = await db.quotation.findUnique({ where: { id: quotationId } });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  assertOwnership(q, actor);
  assertEditable(q.status);

  const existingLine = await db.quotationLine.findUnique({
    where: { id: lineId },
  });
  if (!existingLine || existingLine.quotationId !== quotationId) {
    throw Object.assign(new Error("LINE_NOT_FOUND"), { http: 404 });
  }

  await db.quotationLine.delete({ where: { id: lineId } });
  await recomputeTotals(quotationId);

  await writeAudit({
    actorId: actor.id,
    actorKind: "user",
    action: "quotation.line_deleted",
    entity: "QuotationLine",
    entityId: lineId,
  });

  return { id: lineId };
}

/** Single authority for all money on the quotation */
export async function recomputeTotals(
  quotationId: string,
  client: DbClient = db,
) {
  const q = await loadQuotationWithLines(quotationId, { prisma: client });
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  for (const l of q.lines) {
    const gross = l.qty * l.unitPriceMinor;
    const disc = Math.round(gross * (l.discountPct / 100));
    const net = gross - disc;
    const tax = Math.round(net * ((l.product.taxRatePct ?? 0) / 100));

    subtotal += gross;
    discountTotal += disc;
    taxTotal += tax;
  }

  const marginPct = orderMarginPct(
    q.lines.map((l) => {
      const gross = l.qty * l.unitPriceMinor;
      const net = gross - Math.round(gross * (l.discountPct / 100));
      return {
        netMinor: net,
        costMinor: l.qty * l.unitCostMinor,
      };
    }),
  );

  await client.quotation.update({
    where: { id: quotationId },
    data: {
      subtotalMinor: subtotal,
      discountTotalMinor: discountTotal,
      taxTotalMinor: taxTotal,
      grandTotalMinor: subtotal - discountTotal + taxTotal,
      marginPct,
      lastActivityAt: new Date(),
    },
  });
}

/** Confirm action — evaluates risk and routes or auto-approves */
export async function confirmQuotation(quotationId: string, actorId: string) {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }
  if (q.salesRepId !== actorId) {
    throw Object.assign(new Error("NOT_OWNER"), { http: 403 });
  }
  if (q.lines.length === 0) {
    throw Object.assign(new Error("CANNOT_CONFIRM_EMPTY_QUOTATION"), {
      http: 400,
    });
  }

  // evaluate risk BEFORE choosing the target, so the transition guard is branch-accurate
  const cfg = await loadRiskConfig(q.customer.tier);
  const risk = computeBlendedRisk(q.lines.map(toRiskLine), cfg);
  const chain = await db.approvalChainRule.findMany({
    orderBy: { minScore: "asc" },
  });
  const levels = resolveRequiredLevels(risk, cfg, chain);

  const target = levels.length === 0 ? "APPROVED" : "PENDING_APPROVAL";
  assertTransition(q.status, target);

  await recomputeTotals(quotationId);

  if (levels.length === 0) {
    await transition(
      q,
      "APPROVED",
      actorId,
      "Within discount limits — auto-approved",
      risk.blendedScore,
    );
    return { status: "APPROVED", risk };
  }

  // Route: persist score + ordered approval steps atomically, then record event + audit
  await db.$transaction([
    db.quotation.update({
      where: { id: q.id },
      data: {
        status: "PENDING_APPROVAL",
        blendedRiskScore: risk.blendedScore,
        lastActivityAt: new Date(),
      },
    }),
    ...levels.map((level, i) =>
      db.approvalStep.create({
        data: {
          quotationId: q.id,
          level,
          sequence: i + 1,
        },
      }),
    ),
  ]);

  await recordEvent(
    q,
    q.status,
    "PENDING_APPROVAL",
    actorId,
    `Routed to ${levels.join(", ")}`,
  );

  return { status: "PENDING_APPROVAL", risk, requiredLevels: levels };
}

export async function evaluateQuotationRisk(
  quotationId: string,
  actor: { id: string; role: string },
) {
  const quotation = await loadQuotationWithLines(quotationId);
  if (!quotation)
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  assertOwnership(quotation, actor);
  const config = await loadRiskConfig(quotation.customer.tier);
  const risk = computeBlendedRisk(quotation.lines.map(toRiskLine), config);
  const rules = await db.approvalChainRule.findMany({
    orderBy: { minScore: "asc" },
  });
  return {
    ...risk,
    requiredLevels: resolveRequiredLevels(risk, config, rules),
  };
}
