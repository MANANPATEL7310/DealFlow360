import type { AlertType, QuotationStatus } from "@prisma/client";
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import {
  computeBaseline,
  detectDeliverySlippage,
  detectDiscountAnomaly,
  detectStalled,
  EMPTY_BASELINE,
  mergeCandidates,
  STALL_WATCH_STATES,
  type AlertCandidate,
  type Baseline,
  type Severity,
} from "./detection.js";
import type { AlertFilters, NudgeInput } from "./deal-health.schema.js";
import { loadHealthConfig } from "./health-config.js";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};
const BASELINE_STATES: QuotationStatus[] = [
  "CONFIRMED",
  "FULFILLMENT",
  "BILLING",
  "PAID",
];

function notFound(code: string) {
  return Object.assign(new Error(code), { http: 404 });
}

function realizedDiscountPct(quotation: {
  subtotalMinor: number;
  discountTotalMinor: number;
}): number {
  if (quotation.subtotalMinor <= 0) {
    return 0;
  }

  return (quotation.discountTotalMinor / quotation.subtotalMinor) * 100;
}

async function buildBaselines(
  salesRepIds: string[],
): Promise<Map<string, Baseline>> {
  const baselines = new Map<string, Baseline>();

  for (const salesRepId of salesRepIds) {
    const history = await db.quotation.findMany({
      where: { salesRepId, status: { in: BASELINE_STATES } },
      select: { subtotalMinor: true, discountTotalMinor: true },
    });

    baselines.set(
      salesRepId,
      computeBaseline(history.map(realizedDiscountPct)),
    );
  }

  return baselines;
}

async function upsertAlert(
  candidate: AlertCandidate,
): Promise<"created" | "updated" | "unchanged"> {
  const openAlert = await db.dealHealthAlert.findFirst({
    where: {
      quotationId: candidate.quotationId,
      type: candidate.type as AlertType,
      status: { in: ["open", "acknowledged"] },
    },
    select: { id: true, severity: true, detail: true },
  });

  if (!openAlert) {
    await db.dealHealthAlert.create({
      data: {
        quotationId: candidate.quotationId,
        type: candidate.type as AlertType,
        severity: candidate.severity,
        detail: candidate.detail,
      },
    });
    return "created";
  }

  if (
    openAlert.severity !== candidate.severity ||
    openAlert.detail !== candidate.detail
  ) {
    await db.dealHealthAlert.update({
      where: { id: openAlert.id },
      data: {
        severity: candidate.severity,
        detail: candidate.detail,
      },
    });
    return "updated";
  }

  return "unchanged";
}

async function autoResolveStale(
  candidates: AlertCandidate[],
  now: Date,
): Promise<number> {
  const liveKeys = new Set(
    candidates.map((candidate) => `${candidate.quotationId}:${candidate.type}`),
  );
  const openAlerts = await db.dealHealthAlert.findMany({
    where: { status: { in: ["open", "acknowledged"] } },
    select: { id: true, quotationId: true, type: true },
  });
  const staleIds = openAlerts
    .filter((alert) => !liveKeys.has(`${alert.quotationId}:${alert.type}`))
    .map((alert) => alert.id);

  if (staleIds.length === 0) {
    return 0;
  }

  await db.dealHealthAlert.updateMany({
    where: { id: { in: staleIds } },
    data: { status: "resolved", resolvedAt: now },
  });

  return staleIds.length;
}

export async function runDetection(now = new Date()) {
  const config = await loadHealthConfig();
  const workingQuotations = await db.quotation.findMany({
    where: { status: { in: [...STALL_WATCH_STATES] as QuotationStatus[] } },
    select: {
      id: true,
      status: true,
      salesRepId: true,
      lastActivityAt: true,
      updatedAt: true,
      subtotalMinor: true,
      discountTotalMinor: true,
    },
  });
  const baselines = await buildBaselines([
    ...new Set(workingQuotations.map((quotation) => quotation.salesRepId)),
  ]);

  const overdueSplits = await db.fulfillmentSplit.findMany({
    where: { shippedAt: null, promisedAt: { lt: now } },
    select: {
      id: true,
      promisedAt: true,
      shippedAt: true,
      warehouse: { select: { name: true } },
      plan: { select: { quotationId: true } },
    },
  });

  const candidates: AlertCandidate[] = [];

  for (const quotation of workingQuotations) {
    const stalled = detectStalled(
      {
        quotationId: quotation.id,
        status: quotation.status,
        lastActivityAt: quotation.lastActivityAt ?? quotation.updatedAt,
      },
      now,
      config,
    );
    if (stalled) {
      candidates.push(stalled);
    }

    const anomaly = detectDiscountAnomaly(
      {
        quotationId: quotation.id,
        discountPct: realizedDiscountPct(quotation),
      },
      baselines.get(quotation.salesRepId) ?? EMPTY_BASELINE,
      config,
    );
    if (anomaly) {
      candidates.push(anomaly);
    }
  }

  for (const split of overdueSplits) {
    const slippage = detectDeliverySlippage(
      {
        quotationId: split.plan.quotationId,
        splitId: split.id,
        warehouseName: split.warehouse.name,
        promisedAt: split.promisedAt,
        shippedAt: split.shippedAt,
      },
      now,
    );
    if (slippage) {
      candidates.push(slippage);
    }
  }

  const merged = mergeCandidates(candidates);
  let created = 0;
  let updated = 0;

  for (const candidate of merged) {
    const result = await upsertAlert(candidate);
    if (result === "created") {
      created += 1;
    }
    if (result === "updated") {
      updated += 1;
    }
  }

  const resolved = await autoResolveStale(merged, now);

  return {
    created,
    updated,
    resolved,
    scanned: workingQuotations.length + overdueSplits.length,
  };
}

export async function listAlerts(filters: AlertFilters) {
  const rows = await db.dealHealthAlert.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type as AlertType } : {}),
      ...(filters.severity ? { severity: filters.severity } : {}),
    },
    include: {
      quotation: {
        select: {
          id: true,
          status: true,
          grandTotalMinor: true,
          salesRepId: true,
          owner: { select: { id: true, name: true, email: true } },
          customer: { select: { id: true, name: true, tier: true } },
        },
      },
    },
  });

  return rows.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity as Severity] -
        SEVERITY_RANK[a.severity as Severity] ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getOpenAlerts() {
  return listAlerts({ status: "open" });
}

export async function getOpenAlertIds() {
  const alerts = await db.dealHealthAlert.findMany({
    where: { status: "open" },
    select: { id: true },
  });

  return alerts.map((alert) => alert.id);
}

export async function getQuotationTimeline(quotationId: string) {
  const quotation = await db.quotation.findUnique({
    where: { id: quotationId },
    select: {
      id: true,
      status: true,
      lastActivityAt: true,
      createdAt: true,
      updatedAt: true,
      statusEvents: {
        orderBy: { createdAt: "asc" },
        select: {
          fromStatus: true,
          toStatus: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });
  if (!quotation) {
    throw notFound("QUOTATION_NOT_FOUND");
  }

  return quotation;
}

export async function getRepStats(repId: string) {
  const [openAlertCount, quoteCount, paidQuoteCount] = await Promise.all([
    db.dealHealthAlert.count({
      where: { status: "open", quotation: { salesRepId: repId } },
    }),
    db.quotation.count({ where: { salesRepId: repId } }),
    db.quotation.count({ where: { salesRepId: repId, status: "PAID" } }),
  ]);

  return {
    repId,
    openAlertCount,
    quoteCount,
    paidQuoteCount,
    paidRate: quoteCount > 0 ? paidQuoteCount / quoteCount : 0,
  };
}

export async function acknowledgeAlert(id: string) {
  const alert = await db.dealHealthAlert.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!alert) {
    throw notFound("ALERT_NOT_FOUND");
  }

  return db.dealHealthAlert.update({
    where: { id },
    data: { status: "acknowledged" },
  });
}

export async function resolveAlert(id: string) {
  const alert = await db.dealHealthAlert.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!alert) {
    throw notFound("ALERT_NOT_FOUND");
  }

  return db.dealHealthAlert.update({
    where: { id },
    data: { status: "resolved", resolvedAt: new Date() },
  });
}

export async function nudgeOrEscalate(
  id: string,
  actorId: string,
  input: NudgeInput,
) {
  const alert = await db.dealHealthAlert.findUnique({
    where: { id },
    select: { id: true, type: true, quotationId: true },
  });
  if (!alert) {
    throw notFound("ALERT_NOT_FOUND");
  }

  const shouldEscalate = Boolean(input.escalateToUserId);
  const updated = await db.dealHealthAlert.update({
    where: { id },
    data: shouldEscalate
      ? { severity: "high", status: "open" }
      : { status: "acknowledged" },
  });

  await writeAudit({
    actorId,
    actorKind: "user",
    action: shouldEscalate ? "health.alert.escalated" : "health.nudge.sent",
    entity: "DealHealthAlert",
    entityId: alert.id,
    reason: shouldEscalate
      ? `Escalated to ${input.escalateToUserId}`
      : input.message,
    diff: {
      quotationId: alert.quotationId,
      alertType: alert.type,
      message: input.message ?? null,
      escalateToUserId: input.escalateToUserId ?? null,
    },
  });

  return updated;
}
