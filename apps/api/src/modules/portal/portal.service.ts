import type { SubmitNegotiationInput } from "@template/shared";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { loadRiskConfig } from "../discount/risk-config.js";
import { computeBlendedRisk } from "../discount/risk-engine.js";
import { resolveRequiredLevels } from "../discount/routing.service.js";
import { onConfirmed } from "../quotation/confirmed.hook.js";
import { assertTransition, transition } from "../quotation/lifecycle.js";
import {
  type DbClient,
  loadQuotationWithLines,
  recomputeTotals,
  toRiskLine,
} from "../quotation/quotation.service.js";

interface QuotationLineProjection {
  id: string;
  product?: { name?: string | null } | null;
  qty: number;
  unitPriceMinor: number;
  discountPct: number;
  lineType: string;
}

interface NegotiationProjection {
  id: string;
  lineId: string | null;
  comment: string | null;
  counterDiscountPct: number | null;
  status: string;
  createdAt: Date;
}

interface QuotationProjection {
  id: string;
  status: string;
  customer?: { name?: string; currency?: string } | null;
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  grandTotalMinor: number;
  lines?: QuotationLineProjection[];
  negotiations?: NegotiationProjection[];
}

/** Safe customer projection — strips cost, margin, risk breakdown, approvals, and audit */
export function scopedSummary(q: QuotationProjection) {
  return {
    id: q.id,
    status: q.status,
    customerName: q.customer?.name ?? "",
    currency: q.customer?.currency ?? "USD",
    subtotalMinor: q.subtotalMinor,
    discountTotalMinor: q.discountTotalMinor,
    taxTotalMinor: q.taxTotalMinor,
    grandTotalMinor: q.grandTotalMinor,
    lines: (q.lines || []).map((l) => ({
      id: l.id,
      name: l.product?.name ?? "Item",
      qty: l.qty,
      unitPriceMinor: l.unitPriceMinor,
      discountPct: l.discountPct,
      lineType: l.lineType,
    })),
    negotiations: (q.negotiations || []).map((n) => ({
      id: n.id,
      lineId: n.lineId,
      comment: n.comment,
      counterDiscountPct: n.counterDiscountPct,
      status: n.status,
      createdAt: n.createdAt,
    })),
  };
}

export async function getPortalQuotation(quotationId: string) {
  const q = await loadQuotationWithLines(quotationId, {
    includeNegotiations: true,
  });
  if (!q) {
    throw Object.assign(new Error("Quotation not found."), {
      http: 404,
      code: "QUOTATION_NOT_FOUND",
    });
  }
  return scopedSummary(q);
}

/** Open action: marks SENT -> UNDER_NEGOTIATION idempotently */
export async function openPortal(quotationId: string, contactId: string) {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) {
    throw Object.assign(new Error("Quotation not found."), {
      http: 404,
      code: "QUOTATION_NOT_FOUND",
    });
  }

  if (q.status === "SENT") {
    await transition(
      q,
      "UNDER_NEGOTIATION",
      contactId,
      `Opened by customer contact ${contactId}`,
      undefined,
      "customer",
    );
  }

  return getPortalQuotation(quotationId);
}

/** Submit negotiation request (line-level or order-level) */
export async function submitNegotiation(
  quotationId: string,
  contactId: string,
  input: SubmitNegotiationInput,
) {
  const q = await db.quotation.findUnique({
    where: { id: quotationId },
    include: { lines: true },
  });

  if (!q) {
    throw Object.assign(new Error("Quotation not found."), {
      http: 404,
      code: "QUOTATION_NOT_FOUND",
    });
  }
  if (q.status !== "UNDER_NEGOTIATION") {
    throw Object.assign(new Error("Quotation is not under negotiation."), {
      http: 409,
      code: "NOT_NEGOTIATING",
    });
  }
  if (input.lineId && !q.lines.some((l) => l.id === input.lineId)) {
    throw Object.assign(
      new Error("Target line item does not exist on this quotation."),
      { http: 422, code: "LINE_NOT_ON_QUOTE" },
    );
  }

  const negotiation = await db.negotiationRequest.create({
    data: {
      quotationId,
      contactId,
      lineId: input.lineId ?? null,
      comment: input.comment ?? null,
      counterDiscountPct: input.counterDiscountPct ?? null,
      status: "OPEN",
    },
  });

  await writeAudit({
    actorId: contactId,
    actorKind: "customer",
    action: "negotiation.submitted",
    entity: "NegotiationRequest",
    entityId: negotiation.id,
    diff: { quotationId, ...input },
  });

  return negotiation;
}

/**
 * Customer confirmation — the governance gate.
 * Folds accepted counter-offers into line discounts, re-evaluates risk,
 * and routes to CONFIRMED or back to PENDING_APPROVAL.
 */
export async function portalConfirm(quotationId: string, contactId: string) {
  return db.$transaction(async (tx) => {
    let q = await loadQuotationWithLines(quotationId, {
      prisma: tx,
      includeNegotiations: true,
    });

    if (!q) {
      throw Object.assign(new Error("Quotation not found."), {
        http: 404,
        code: "QUOTATION_NOT_FOUND",
      });
    }
    if (q.status !== "UNDER_NEGOTIATION") {
      throw Object.assign(new Error("Quotation is not under negotiation."), {
        http: 409,
        code: "NOT_NEGOTIATING",
      });
    }

    // 1) Fold every ACCEPTED counter into line discounts, then recompute totals
    await applyAcceptedCounters(tx, q);
    q = await loadQuotationWithLines(quotationId, {
      prisma: tx,
      includeNegotiations: true,
    });
    if (!q) {
      throw Object.assign(new Error("Quotation not found."), {
        http: 404,
        code: "QUOTATION_NOT_FOUND",
      });
    }

    // 2) Re-evaluate risk on the NEW terms
    const cfg = await loadRiskConfig(q.customer.tier);
    const risk = computeBlendedRisk(q.lines.map(toRiskLine), cfg);
    const chain = await tx.approvalChainRule.findMany({
      orderBy: { minScore: "asc" },
    });
    const levels = resolveRequiredLevels(risk, cfg, chain);

    // 3) Governance Gate: The customer CANNOT self-approve an overage
    if (levels.length > 0) {
      assertTransition(q.status, "PENDING_APPROVAL");

      await tx.quotation.update({
        where: { id: q.id },
        data: {
          status: "PENDING_APPROVAL",
          blendedRiskScore: risk.blendedScore,
          lastActivityAt: new Date(),
        },
      });

      // Reset and create fresh approval steps for required levels
      await tx.approvalStep.deleteMany({ where: { quotationId: q.id } });
      await Promise.all(
        levels.map((level, i) =>
          tx.approvalStep.create({
            data: {
              quotationId: q.id,
              level,
              sequence: i + 1,
            },
          }),
        ),
      );

      await tx.quotationStatusEvent.create({
        data: {
          quotationId: q.id,
          fromStatus: q.status,
          toStatus: "PENDING_APPROVAL",
          actorId: null,
          reason: "Customer counter-offer exceeded discount thresholds",
        },
      });

      await writeAudit({
        actorId: contactId,
        actorKind: "customer",
        action: "portal.confirm.escalated",
        entity: "Quotation",
        entityId: q.id,
        reason: "Customer counter-offer exceeded discount thresholds",
        diff: { blendedScore: risk.blendedScore, requiredLevels: levels },
      });

      return {
        status: "PENDING_APPROVAL" as const,
        requiredLevels: levels,
        risk,
      };
    }

    // Within limits -> Transition to CONFIRMED
    assertTransition(q.status, "CONFIRMED");

    await tx.quotation.update({
      where: { id: q.id },
      data: {
        status: "CONFIRMED",
        blendedRiskScore: risk.blendedScore,
        lastActivityAt: new Date(),
      },
    });

    await tx.quotationStatusEvent.create({
      data: {
        quotationId: q.id,
        fromStatus: q.status,
        toStatus: "CONFIRMED",
        actorId: null,
        reason: "Customer confirmed quotation within limits",
      },
    });

    await onConfirmed(q.id, tx);

    await writeAudit({
      actorId: contactId,
      actorKind: "customer",
      action: "portal.confirm.confirmed",
      entity: "Quotation",
      entityId: q.id,
      reason: "Customer confirmed quotation within limits",
      diff: { blendedScore: risk.blendedScore },
    });

    return { status: "CONFIRMED" as const, risk };
  });
}

async function applyAcceptedCounters(tx: DbClient, q: { id: string }) {
  const accepted = await tx.negotiationRequest.findMany({
    where: {
      quotationId: q.id,
      status: "ACCEPTED",
      counterDiscountPct: { not: null },
    },
    orderBy: { createdAt: "asc" }, // deterministic: later requests win
  });

  for (const n of accepted) {
    if (n.lineId) {
      await tx.quotationLine.update({
        where: { id: n.lineId },
        data: { discountPct: n.counterDiscountPct! },
      });
    } else {
      await tx.quotationLine.updateMany({
        where: { quotationId: q.id },
        data: { discountPct: n.counterDiscountPct! },
      });
    }
  }

  await recomputeTotals(q.id, tx);
}

export async function loadNegotiationRequest(requestId: string) {
  const neg = await db.negotiationRequest.findUnique({
    where: { id: requestId },
    include: {
      quotation: {
        include: {
          customer: { select: { id: true, tier: true, currency: true } },
          lines: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!neg) {
    throw Object.assign(new Error("NEGOTIATION_NOT_FOUND"), { http: 404 });
  }

  return {
    id: neg.id,
    quotationId: neg.quotationId,
    lineId: neg.lineId,
    comment: neg.comment,
    counterDiscountPct: neg.counterDiscountPct,
    status: neg.status,
    customerTier: neg.quotation.customer.tier,
    currency: neg.quotation.customer.currency,
    affectedLines: neg.lineId
      ? neg.quotation.lines.filter((l) => l.id === neg.lineId)
      : neg.quotation.lines,
  };
}

/**
 * Calculates in-memory hypothetical lines IF the counter discount were accepted.
 * Crucial: Persists NOTHING to the database.
 */
export async function hypotheticalAcceptedLines(requestId: string) {
  const neg = await loadNegotiationRequest(requestId);
  const q = await loadQuotationWithLines(neg.quotationId);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  // Clone lines in-memory and apply the hypothetical counter discount
  const lines = q.lines.map((l) => {
    let discountPct = l.discountPct;
    if (
      neg.counterDiscountPct !== null &&
      neg.counterDiscountPct !== undefined
    ) {
      if (!neg.lineId || neg.lineId === l.id) {
        discountPct = neg.counterDiscountPct;
      }
    }
    return {
      ...l,
      discountPct,
    };
  });

  return {
    lines,
    tier: q.customer.tier,
    quotationId: q.id,
  };
}
