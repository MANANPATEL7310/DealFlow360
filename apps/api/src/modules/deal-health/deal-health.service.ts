import {
  type DealAnomalyType,
  type DealHealthAlert,
  type DealHealthScore,
  type DealHealthSeverity,
  type DealHealthStatus,
  type DealHealthSummary,
  type Quotation,
  SEED_QUOTATIONS,
} from "@template/shared";
import {
  computeDealHealthScore,
  scanQuotationForAnomalies,
} from "./deal-health.detector.js";

// In-memory alert store
const alertsStore = new Map<string, DealHealthAlert>();
const healthScoresCache = new Map<string, DealHealthScore>();
let lastScannedTimestamp = new Date().toISOString();

// Seed initial realistic alerts for platform initialization
const INITIAL_ALERTS: DealHealthAlert[] = [
  {
    id: "alt-dsc-qt-102",
    quotationId: "qt-102",
    quotationCode: "QT-2026-002",
    customerName: "Nordic Dynamics Oy",
    customerTier: "SILVER",
    salesRepName: "Alex Miller",
    type: "DISCOUNT_ANOMALY",
    severity: "high",
    title: "Blended discount 16.5% exceeds Silver Tier 12.0% ceiling",
    detail: "Non-standard concession applied to Edge 2U enterprise servers without VP approval sign-off.",
    metrics: {
      discountPct: 16.5,
      baselineDiscountPct: 6.8,
      atRiskAmountMinor: 480000,
    },
    recommendedAction: "Escalate to Sales Operations Director or adjust volume commitment.",
    status: "open",
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    updatedAt: new Date(Date.now() - 36000000).toISOString(),
  },
  {
    id: "alt-dlv-qt-104",
    quotationId: "qt-104",
    quotationCode: "QT-2026-004",
    customerName: "Vertex AI Labs",
    customerTier: "BRONZE",
    salesRepName: "Elena Rostova",
    type: "DELIVERY_SLIPPAGE",
    severity: "critical",
    title: "Regional warehouse stock deficit for promised delivery",
    detail: "Warehouse Central has only 2 units in stock against 12 units committed on quotation line 1.",
    metrics: {
      deficitUnits: 10,
      atRiskAmountMinor: 3800000,
    },
    recommendedAction: "Execute multi-depot split with Western Coast Hub or postpone delivery commitment.",
    status: "open",
    createdAt: new Date(Date.now() - 72000000).toISOString(),
    updatedAt: new Date(Date.now() - 72000000).toISOString(),
  },
  {
    id: "alt-stl-qt-103",
    quotationId: "qt-103",
    quotationCode: "QT-2026-003",
    customerName: "Horizon Media Systems",
    customerTier: "BRONZE",
    salesRepName: "Marcus Vance",
    type: "STALLED",
    severity: "medium",
    title: "Proposal idle in Negotiation for 18 days",
    detail: "Customer has not reviewed or signed proposal since magic link dispatched on August 18.",
    metrics: {
      idleDays: 18,
      atRiskAmountMinor: 1850000,
    },
    recommendedAction: "Dispatch automated re-engagement pulse via Customer Portal.",
    status: "open",
    createdAt: new Date(Date.now() - 140000000).toISOString(),
    updatedAt: new Date(Date.now() - 140000000).toISOString(),
  },
];

for (const alt of INITIAL_ALERTS) {
  alertsStore.set(alt.id, alt);
}

export class DealHealthService {
  /**
   * Runs an autonomous anomaly detection scan across all quotations.
   */
  runDetectionScan(quotations: Quotation[] = SEED_QUOTATIONS): {
    alerts: DealHealthAlert[];
    scores: DealHealthScore[];
    summary: DealHealthSummary;
  } {
    lastScannedTimestamp = new Date().toISOString();

    for (const quote of quotations) {
      // Run deterministic detector
      const detected = scanQuotationForAnomalies(quote);

      // Merge into alerts store
      for (const alert of detected) {
        // Find existing open alert of same type for this quote
        const existing = Array.from(alertsStore.values()).find(
          (a) => a.quotationId === alert.quotationId && a.type === alert.type && a.status === "open",
        );

        if (!existing) {
          alertsStore.set(alert.id, alert);
        }
      }

      // Compute health score using all active alerts for this quotation
      const quoteAlerts = Array.from(alertsStore.values()).filter(
        (a) => a.quotationId === quote.id && a.status === "open",
      );

      const healthScore = computeDealHealthScore(quote, quoteAlerts);
      healthScoresCache.set(quote.id, healthScore);
    }

    const alerts = this.getAlerts();
    const scores = Array.from(healthScoresCache.values());
    const summary = this.getSummary(quotations);

    return { alerts, scores, summary };
  }

  /**
   * Retrieves alerts with optional filtering.
   */
  getAlerts(filters?: {
    status?: DealHealthStatus;
    severity?: DealHealthSeverity;
    type?: DealAnomalyType;
    quotationId?: string;
  }): DealHealthAlert[] {
    let list = Array.from(alertsStore.values());

    if (filters?.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.severity) {
      list = list.filter((a) => a.severity === filters.severity);
    }
    if (filters?.type) {
      list = list.filter((a) => a.type === filters.type);
    }
    if (filters?.quotationId) {
      list = list.filter((a) => a.quotationId === filters.quotationId);
    }

    // Sort: open first, critical first, newest first
    const severityRank: Record<DealHealthSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return list.sort((a, b) => {
      if (a.status === "open" && b.status !== "open") return -1;
      if (a.status !== "open" && b.status === "open") return 1;

      const diffSev = severityRank[b.severity] - severityRank[a.severity];
      if (diffSev !== 0) return diffSev;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Retrieves composite scores for all or specific quotations.
   */
  getHealthScores(quotations: Quotation[] = SEED_QUOTATIONS): DealHealthScore[] {
    if (healthScoresCache.size === 0) {
      this.runDetectionScan(quotations);
    }
    return Array.from(healthScoresCache.values());
  }

  /**
   * Acknowledges an active anomaly alert.
   */
  acknowledgeAlert(alertId: string, note?: string, userId = "usr-sales-op"): DealHealthAlert {
    const alert = alertsStore.get(alertId);
    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found.`);
    }

    alert.status = "acknowledged";
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date().toISOString();
    alert.updatedAt = new Date().toISOString();
    if (note) alert.resolutionNote = note;

    alertsStore.set(alert.id, alert);
    return alert;
  }

  /**
   * Resolves an anomaly alert with audit trail.
   */
  resolveAlert(
    alertId: string,
    resolutionNote: string,
    _actionTaken?: string,
    userId = "usr-sales-op",
  ): DealHealthAlert {
    const alert = alertsStore.get(alertId);
    if (!alert) {
      throw new Error(`Alert with ID ${alertId} not found.`);
    }

    alert.status = "resolved";
    alert.resolvedAt = new Date().toISOString();
    alert.acknowledgedBy = alert.acknowledgedBy ?? userId;
    alert.resolutionNote = resolutionNote;
    alert.updatedAt = new Date().toISOString();

    alertsStore.set(alert.id, alert);

    // Refresh health score for the affected quotation
    const quote = SEED_QUOTATIONS.find((q) => q.id === alert.quotationId);
    if (quote) {
      const remainingAlerts = Array.from(alertsStore.values()).filter(
        (a) => a.quotationId === quote.id && a.status === "open",
      );
      healthScoresCache.set(quote.id, computeDealHealthScore(quote, remainingAlerts));
    }

    return alert;
  }

  /**
   * Aggregates platform-wide radar KPIs and at-risk metrics.
   */
  getSummary(quotations: Quotation[] = SEED_QUOTATIONS): DealHealthSummary {
    if (healthScoresCache.size === 0) {
      this.runDetectionScan(quotations);
    }

    const scores = Array.from(healthScoresCache.values());
    const openAlerts = Array.from(alertsStore.values()).filter((a) => a.status === "open");

    const healthyDealsCount = scores.filter((s) => s.category === "HEALTHY").length;
    const watchDealsCount = scores.filter((s) => s.category === "WATCH").length;
    const atRiskDealsCount = scores.filter((s) => s.category === "AT_RISK").length;
    const criticalDealsCount = scores.filter((s) => s.category === "CRITICAL").length;

    // Sum at-risk value for critical and at-risk quotations
    const totalAtRiskValueMinor = scores
      .filter((s) => s.category === "CRITICAL" || s.category === "AT_RISK")
      .reduce((sum, s) => sum + s.netTotalMinor, 0);

    const anomaliesByType: Record<DealAnomalyType, number> = {
      STALLED: openAlerts.filter((a) => a.type === "STALLED").length,
      DISCOUNT_ANOMALY: openAlerts.filter((a) => a.type === "DISCOUNT_ANOMALY").length,
      DELIVERY_SLIPPAGE: openAlerts.filter((a) => a.type === "DELIVERY_SLIPPAGE").length,
      MARGIN_EROSION: openAlerts.filter((a) => a.type === "MARGIN_EROSION").length,
    };

    return {
      monitoredDealsCount: quotations.length,
      healthyDealsCount,
      watchDealsCount,
      atRiskDealsCount,
      criticalDealsCount,
      totalAtRiskValueMinor,
      openAlertsCount: openAlerts.length,
      anomaliesByType,
      lastScannedAt: lastScannedTimestamp,
    };
  }
}

export const dealHealthService = new DealHealthService();
