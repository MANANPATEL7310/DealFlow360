export type AlertType = "STALLED" | "DISCOUNT_ANOMALY" | "DELIVERY_SLIPPAGE";

export type Severity = "low" | "medium" | "high";

export interface AlertCandidate {
  quotationId: string;
  type: AlertType;
  severity: Severity;
  detail: string;
}

export interface HealthConfig {
  stalledDays: number;
  anomalyK: number;
  minBaselineSample: number;
}

export interface StalledInput {
  quotationId: string;
  status: string;
  lastActivityAt: Date;
}

export interface Baseline {
  mean: number;
  stddev: number;
  sampleSize: number;
}

export interface DiscountInput {
  quotationId: string;
  discountPct: number;
}

export interface SplitInput {
  quotationId: string;
  splitId: string;
  warehouseName?: string;
  promisedAt: Date | null;
  shippedAt: Date | null;
}

const DAY_MS = 86_400_000;
const SLIP_HIGH_DAYS = 3;
const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export const EMPTY_BASELINE: Baseline = {
  mean: 0,
  stddev: 0,
  sampleSize: 0,
};

export const STALL_WATCH_STATES: ReadonlySet<string> = new Set([
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "UNDER_NEGOTIATION",
]);

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

export function detectStalled(
  quotation: StalledInput,
  now: Date,
  config: HealthConfig,
): AlertCandidate | null {
  if (!STALL_WATCH_STATES.has(quotation.status)) {
    return null;
  }

  const idleDays = daysBetween(quotation.lastActivityAt, now);
  if (idleDays <= config.stalledDays) {
    return null;
  }

  return {
    quotationId: quotation.quotationId,
    type: "STALLED",
    severity: idleDays >= config.stalledDays * 2 ? "high" : "medium",
    detail: `No activity for ${idleDays} days (threshold ${config.stalledDays}) while in ${quotation.status}.`,
  };
}

export function computeBaseline(discountPcts: number[]): Baseline {
  const sampleSize = discountPcts.length;
  if (sampleSize === 0) {
    return EMPTY_BASELINE;
  }

  const mean =
    discountPcts.reduce((total, discountPct) => total + discountPct, 0) /
    sampleSize;
  const variance =
    discountPcts.reduce(
      (total, discountPct) => total + (discountPct - mean) ** 2,
      0,
    ) / sampleSize;

  return {
    mean,
    stddev: Math.sqrt(variance),
    sampleSize,
  };
}

export function detectDiscountAnomaly(
  quotation: DiscountInput,
  baseline: Baseline,
  config: HealthConfig,
): AlertCandidate | null {
  if (baseline.sampleSize < config.minBaselineSample) {
    return null;
  }

  if (baseline.stddev === 0) {
    if (quotation.discountPct <= baseline.mean) {
      return null;
    }

    return {
      quotationId: quotation.quotationId,
      type: "DISCOUNT_ANOMALY",
      severity: "high",
      detail: `Discount ${quotation.discountPct.toFixed(1)}% exceeds the rep's flat historical ${baseline.mean.toFixed(1)}%.`,
    };
  }

  const zScore = (quotation.discountPct - baseline.mean) / baseline.stddev;
  if (zScore <= config.anomalyK) {
    return null;
  }

  return {
    quotationId: quotation.quotationId,
    type: "DISCOUNT_ANOMALY",
    severity: zScore > config.anomalyK * 2 ? "high" : "medium",
    detail:
      `Discount ${quotation.discountPct.toFixed(1)}% is ${zScore.toFixed(1)} sigma above the rep's mean ` +
      `${baseline.mean.toFixed(1)}% (sigma=${baseline.stddev.toFixed(1)}, k=${config.anomalyK}).`,
  };
}

export function detectDeliverySlippage(
  split: SplitInput,
  now: Date,
): AlertCandidate | null {
  if (!split.promisedAt || split.shippedAt) {
    return null;
  }

  if (split.promisedAt.getTime() >= now.getTime()) {
    return null;
  }

  const lateDays = daysBetween(split.promisedAt, now);
  const warehouseDetail = split.warehouseName
    ? ` from ${split.warehouseName}`
    : "";

  return {
    quotationId: split.quotationId,
    type: "DELIVERY_SLIPPAGE",
    severity: lateDays > SLIP_HIGH_DAYS ? "high" : "medium",
    detail:
      `Shipment${warehouseDetail} promised ${split.promisedAt.toISOString().slice(0, 10)} is ` +
      `${lateDays} day(s) overdue and not shipped.`,
  };
}

export function mergeCandidates(
  candidates: AlertCandidate[],
): AlertCandidate[] {
  const candidatesByKey = new Map<string, AlertCandidate>();

  for (const candidate of candidates) {
    const key = `${candidate.quotationId}:${candidate.type}`;
    const existing = candidatesByKey.get(key);

    if (
      !existing ||
      SEVERITY_RANK[candidate.severity] > SEVERITY_RANK[existing.severity]
    ) {
      candidatesByKey.set(key, candidate);
    }
  }

  return [...candidatesByKey.values()];
}
