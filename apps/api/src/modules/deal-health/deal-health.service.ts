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

  return rows
    .sort(
      (a, b) =>
        SEVERITY_RANK[b.severity as Severity] -
          SEVERITY_RANK[a.severity as Severity] ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .map((alert) => ({
      id: alert.id,
      quotationId: alert.quotationId,
      quotationCode: alert.quotationId,
      customerName: alert.quotation.customer.name,
      customerTier: alert.quotation.customer.tier,
      salesRepName: alert.quotation.owner.name,
      type: alert.type,
      severity: alert.severity,
      title: alert.type.replaceAll("_", " "),
      detail: alert.detail,
      metrics: { atRiskAmountMinor: alert.quotation.grandTotalMinor },
      recommendedAction: "Review the alert and record the corrective action.",
      status: alert.status,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolutionNote: null,
      resolvedAt: alert.resolvedAt?.toISOString() ?? null,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    }));
}

export async function getHealthSummary() {
  const [quotations, alerts] = await Promise.all([
    db.quotation.findMany({
      include: { customer: true, owner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    listAlerts({ status: "open" }),
  ]);
  const alertsByQuotation = new Map<string, typeof alerts>();
  for (const alert of alerts)
    alertsByQuotation.set(alert.quotationId, [
      ...(alertsByQuotation.get(alert.quotationId) ?? []),
      alert,
    ]);
  const scores = quotations.map((quotation) => {
    const activeAlerts = alertsByQuotation.get(quotation.id) ?? [];
    const severityPenalty = activeAlerts.reduce(
      (total, alert) =>
        total + ({ low: 10, medium: 25, high: 45 }[alert.severity] ?? 0),
      0,
    );
    const score = Math.max(0, Math.min(100, 100 - severityPenalty));
    const category: "HEALTHY" | "WATCH" | "AT_RISK" | "CRITICAL" =
      score < 45
        ? "CRITICAL"
        : score < 65
          ? "AT_RISK"
          : score < 80
            ? "WATCH"
            : "HEALTHY";
    const daysInStage = Math.max(
      0,
      Math.floor((Date.now() - quotation.updatedAt.getTime()) / 86_400_000),
    );
    return {
      quotationId: quotation.id,
      quotationCode: quotation.id,
      customerName: quotation.customer.name,
      customerTier: quotation.customer.tier,
      salesRepName: quotation.owner.name,
      score,
      category,
      stage: quotation.status,
      netTotalMinor: quotation.grandTotalMinor,
      marginPct: quotation.marginPct,
      daysInStage,
      factors: {
        marginHealth: Math.max(0, Math.min(100, quotation.marginPct * 2.5)),
        velocityHealth: Math.max(0, 100 - daysInStage * 5),
        fulfillmentHealth: activeAlerts.some(
          (alert) => alert.type === "DELIVERY_SLIPPAGE",
        )
          ? 40
          : 100,
        discountCompliance: activeAlerts.some(
          (alert) => alert.type === "DISCOUNT_ANOMALY",
        )
          ? 40
          : 100,
      },
      activeAlertCount: activeAlerts.length,
      activeAnomalies: activeAlerts.map((alert) => alert.type),
    };
  });
  const counts = { HEALTHY: 0, WATCH: 0, AT_RISK: 0, CRITICAL: 0 };
  for (const score of scores) counts[score.category] += 1;
  return {
    summary: {
      monitoredDealsCount: scores.length,
      healthyDealsCount: counts.HEALTHY,
      watchDealsCount: counts.WATCH,
      atRiskDealsCount: counts.AT_RISK,
      criticalDealsCount: counts.CRITICAL,
      totalAtRiskValueMinor: scores
        .filter(
          (score) =>
            score.category === "AT_RISK" || score.category === "CRITICAL",
        )
        .reduce((total, score) => total + score.netTotalMinor, 0),
      openAlertsCount: alerts.length,
      anomaliesByType: {
        STALLED: alerts.filter((alert) => alert.type === "STALLED").length,
        DISCOUNT_ANOMALY: alerts.filter(
          (alert) => alert.type === "DISCOUNT_ANOMALY",
        ).length,
        DELIVERY_SLIPPAGE: alerts.filter(
          (alert) => alert.type === "DELIVERY_SLIPPAGE",
        ).length,
        MARGIN_EROSION: 0,
      },
      lastScannedAt: new Date().toISOString(),
    },
    scores,
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
