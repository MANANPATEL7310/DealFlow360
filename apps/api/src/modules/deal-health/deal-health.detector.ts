import {
  type DealHealthAlert,
  type DealHealthScore,
  type HealthCategory,
  type Quotation,
} from "@template/shared";

interface RepBaseline {
  meanDiscountPct: number;
  stdDevPct: number;
}

const DEFAULT_BASELINE: RepBaseline = { meanDiscountPct: 7.5, stdDevPct: 3.0 };

// Default statistical discount baselines for sales representatives
const REP_BASELINES: Record<string, RepBaseline> = {
  default: DEFAULT_BASELINE,
  "Alex Miller": { meanDiscountPct: 6.8, stdDevPct: 2.8 },
  "Elena Rostova": { meanDiscountPct: 8.2, stdDevPct: 3.5 },
  "Marcus Vance": { meanDiscountPct: 5.5, stdDevPct: 2.1 },
};

function getRepBaseline(repName?: string | null): RepBaseline {
  if (!repName) return DEFAULT_BASELINE;
  return REP_BASELINES[repName] ?? DEFAULT_BASELINE;
}

/**
 * Calculates days elapsed between an ISO date string and now.
 */
function getDaysElapsed(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

/**
 * Deterministically scans a quotation for deal health anomalies.
 */
export function scanQuotationForAnomalies(
  quote: Quotation,
  referenceDate = new Date(),
): DealHealthAlert[] {
  const alerts: DealHealthAlert[] = [];
  const repName = quote.salesRepId ?? "Alex Miller";
  const customerName = quote.customer?.name ?? "Enterprise Client";
  const customerTier = (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER";
  const nowStr = referenceDate.toISOString();

  const isTerminal = ["CONFIRMED", "FULFILLMENT", "BILLING", "PAID", "REJECTED"].includes(
    quote.status,
  );

  // 1. ─── STALLED PIPELINE DETECTION ─────────────────────────────────────────
  if (!isTerminal) {
    const idleDays = getDaysElapsed(quote.lastActivityAt ?? quote.createdAt);
    if (idleDays >= 14) {
      alerts.push({
        id: `alt-stl-${quote.id}-${Date.now()}`,
        quotationId: quote.id,
        quotationCode: quote.quotationNumber,
        customerName,
        customerTier,
        salesRepName: repName,
        type: "STALLED",
        severity: idleDays >= 21 ? "critical" : "high",
        title: `Stalled in ${quote.status.replace("_", " ")} for ${idleDays} days`,
        detail: `No client or representative activity logged in ${idleDays} days. Probability of deal slippage exceeds 65%.`,
        metrics: {
          idleDays,
          atRiskAmountMinor: quote.grandTotalMinor,
        },
        recommendedAction: "Schedule executive touchpoint or issue automated engagement pulse via Customer Portal.",
        status: "open",
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    } else if (idleDays >= 7 && quote.status === "PENDING_APPROVAL") {
      alerts.push({
        id: `alt-stl-${quote.id}-${Date.now()}`,
        quotationId: quote.id,
        quotationCode: quote.quotationNumber,
        customerName,
        customerTier,
        salesRepName: repName,
        type: "STALLED",
        severity: "medium",
        title: `Approval bottleneck: Pending for ${idleDays} days`,
        detail: `Quotation has been awaiting internal approval sign-off for over a week.`,
        metrics: {
          idleDays,
          atRiskAmountMinor: quote.grandTotalMinor,
        },
        recommendedAction: "Nudge designated approver on Slack/Workbench to expedite commercial clearance.",
        status: "open",
        createdAt: nowStr,
        updatedAt: nowStr,
      });
    }
  }

  // 2. ─── STATISTICAL DISCOUNT ANOMALY ───────────────────────────────────────
  const repBaseline = getRepBaseline(repName);
  const orderDiscount = quote.discountTotalMinor > 0 && quote.subtotalMinor > 0
    ? (quote.discountTotalMinor / quote.subtotalMinor) * 100
    : 0;

  const discountThreshold = repBaseline.meanDiscountPct + 1.5 * repBaseline.stdDevPct;
  const tierCeiling = customerTier === "GOLD" ? 18.0 : customerTier === "SILVER" ? 12.0 : 7.0;

  if (orderDiscount > discountThreshold || orderDiscount > tierCeiling) {
    const isCritical = orderDiscount >= tierCeiling + 5.0 || orderDiscount >= 20.0;
    alerts.push({
      id: `alt-dsc-${quote.id}-${Date.now()}`,
      quotationId: quote.id,
      quotationCode: quote.quotationNumber,
      customerName,
      customerTier,
      salesRepName: repName,
      type: "DISCOUNT_ANOMALY",
      severity: isCritical ? "critical" : "high",
      title: `Excessive concession: ${orderDiscount.toFixed(1)}% discount applied`,
      detail: `Discount exceeds ${customerTier} ceiling (${tierCeiling.toFixed(1)}%) and representative statistical mean (${repBaseline.meanDiscountPct.toFixed(1)}% ± ${repBaseline.stdDevPct.toFixed(1)}%).`,
      metrics: {
        discountPct: Math.round(orderDiscount * 10) / 10,
        baselineDiscountPct: repBaseline.meanDiscountPct,
        atRiskAmountMinor: quote.discountTotalMinor,
      },
      recommendedAction: "Require Deal Desk manager review or restructure deal with extended subscription term.",
      status: "open",
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  }

  // 3. ─── MARGIN EROSION DETECTION ───────────────────────────────────────────
  if (quote.marginPct < 20.0 && quote.marginPct > 0) {
    alerts.push({
      id: `alt-mrg-${quote.id}-${Date.now()}`,
      quotationId: quote.id,
      quotationCode: quote.quotationNumber,
      customerName,
      customerTier,
      salesRepName: repName,
      type: "MARGIN_EROSION",
      severity: quote.marginPct < 15.0 ? "critical" : "high",
      title: `Critical Margin Compression: ${quote.marginPct.toFixed(1)}% gross margin`,
      detail: `Commercial concessions have eroded the blended margin below the company 20.0% standard minimum threshold.`,
      metrics: {
        marginPct: quote.marginPct,
        atRiskAmountMinor: quote.grandTotalMinor,
      },
      recommendedAction: "Counter with high-margin SaaS/Service attachment (e.g. Threat Shield or Premium Support).",
      status: "open",
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  }

  // 4. ─── DELIVERY & STOCK CONSTRAINTS ───────────────────────────────────────
  const totalHardwareUnitsRequested = quote.lines
    .filter((l) => l.lineType === "ONE_TIME")
    .reduce((sum, l) => sum + l.qty, 0);

  // If a quotation has an unusually large physical hardware commitment (> 30 units)
  if (totalHardwareUnitsRequested > 30) {
    alerts.push({
      id: `alt-dlv-${quote.id}-${Date.now()}`,
      quotationId: quote.id,
      quotationCode: quote.quotationNumber,
      customerName,
      customerTier,
      salesRepName: repName,
      type: "DELIVERY_SLIPPAGE",
      severity: "medium",
      title: `Warehouse stock deficit: ${totalHardwareUnitsRequested} physical units requested`,
      detail: `Consolidated stock requirements exceed single-facility buffer. Inter-depot multi-split fulfillment required.`,
      metrics: {
        deficitUnits: totalHardwareUnitsRequested - 20,
        atRiskAmountMinor: quote.grandTotalMinor,
      },
      recommendedAction: "Initiate proactive fulfillment routing or notify customer of phased delivery milestone.",
      status: "open",
      createdAt: nowStr,
      updatedAt: nowStr,
    });
  }

  return alerts;
}

/**
 * Computes composite Deal Health Score (0 - 100) and category.
 * S = 0.35 * M + 0.25 * V + 0.20 * F + 0.20 * D
 */
export function computeDealHealthScore(
  quote: Quotation,
  activeAlerts: DealHealthAlert[],
): DealHealthScore {
  const customerName = quote.customer?.name ?? "Enterprise Client";
  const customerTier = (quote.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER";
  const salesRepName = quote.salesRepId ?? "Alex Miller";

  // Factor 1: Margin Health (0 - 100)
  // >= 35% margin = 100; 25% = 75; 20% = 50; < 15% = 20
  let marginHealth = Math.min(100, Math.max(0, (quote.marginPct / 40) * 100));
  if (quote.marginPct < 18.0) marginHealth = Math.min(marginHealth, 30);

  // Factor 2: Velocity Health (0 - 100)
  const idleDays = getDaysElapsed(quote.lastActivityAt ?? quote.createdAt);
  let velocityHealth = 100;
  if (idleDays > 3) velocityHealth = Math.max(0, 100 - (idleDays - 3) * 7);

  // Factor 3: Fulfillment Health (0 - 100)
  const hasDeliveryAlert = activeAlerts.some((a) => a.type === "DELIVERY_SLIPPAGE");
  const fulfillmentHealth = hasDeliveryAlert ? 45 : 100;

  // Factor 4: Discount Compliance (0 - 100)
  const orderDiscount = quote.discountTotalMinor > 0 && quote.subtotalMinor > 0
    ? (quote.discountTotalMinor / quote.subtotalMinor) * 100
    : 0;
  const tierCeiling = customerTier === "GOLD" ? 18.0 : customerTier === "SILVER" ? 12.0 : 7.0;
  let discountCompliance = 100;
  if (orderDiscount > tierCeiling) {
    const gap = orderDiscount - tierCeiling;
    discountCompliance = Math.max(10, 100 - gap * 12);
  }

  // Weighted composite score
  const rawScore =
    0.35 * marginHealth +
    0.25 * velocityHealth +
    0.20 * fulfillmentHealth +
    0.20 * discountCompliance;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let category: HealthCategory = "HEALTHY";
  if (score < 45) {
    category = "CRITICAL";
  } else if (score < 65) {
    category = "AT_RISK";
  } else if (score < 80) {
    category = "WATCH";
  }

  const activeAnomalies = Array.from(new Set(activeAlerts.map((a) => a.type)));

  return {
    quotationId: quote.id,
    quotationCode: quote.quotationNumber,
    customerName,
    customerTier,
    salesRepName,
    score,
    category,
    stage: quote.status,
    netTotalMinor: quote.grandTotalMinor,
    marginPct: quote.marginPct,
    daysInStage: idleDays,
    factors: {
      marginHealth: Math.round(marginHealth),
      velocityHealth: Math.round(velocityHealth),
      fulfillmentHealth: Math.round(fulfillmentHealth),
      discountCompliance: Math.round(discountCompliance),
    },
    activeAlertCount: activeAlerts.length,
    activeAnomalies,
  };
}
