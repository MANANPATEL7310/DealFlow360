import {
  apiRoutes,
  type AcknowledgeAlertInput,
  type DealAnomalyType,
  type DealHealthAlert,
  type DealHealthScore,
  type DealHealthSeverity,
  type DealHealthStatus,
  type DealHealthSummary,
  type ResolveAlertInput,
  SEED_QUOTATIONS,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

// In-memory simulation fallback data
const mockAlerts: DealHealthAlert[] = [
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
    detail:
      "Non-standard concession applied to Edge 2U enterprise servers without VP approval sign-off.",
    metrics: {
      discountPct: 16.5,
      baselineDiscountPct: 6.8,
      atRiskAmountMinor: 480000,
    },
    recommendedAction:
      "Escalate to Sales Operations Director or adjust volume commitment.",
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
    detail:
      "Warehouse Central has only 2 units in stock against 12 units committed on quotation line 1.",
    metrics: {
      deficitUnits: 10,
      atRiskAmountMinor: 3800000,
    },
    recommendedAction:
      "Execute multi-depot split with Western Coast Hub or postpone delivery commitment.",
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
    detail:
      "Customer has not reviewed or signed proposal since magic link dispatched on August 18.",
    metrics: {
      idleDays: 18,
      atRiskAmountMinor: 1850000,
    },
    recommendedAction:
      "Dispatch automated re-engagement pulse via Customer Portal.",
    status: "open",
    createdAt: new Date(Date.now() - 140000000).toISOString(),
    updatedAt: new Date(Date.now() - 140000000).toISOString(),
  },
];

function buildMockScores(): DealHealthScore[] {
  return SEED_QUOTATIONS.map((q) => {
    const qAlerts = mockAlerts.filter(
      (a) => a.quotationId === q.id && a.status === "open",
    );
    let score = 92;

    if (qAlerts.some((a) => a.severity === "critical")) {
      score = 38;
    } else if (qAlerts.some((a) => a.severity === "high")) {
      score = 58;
    } else if (qAlerts.some((a) => a.severity === "medium")) {
      score = 72;
    }

    let category: DealHealthScore["category"] = "HEALTHY";
    if (score < 45) category = "CRITICAL";
    else if (score < 65) category = "AT_RISK";
    else if (score < 80) category = "WATCH";

    return {
      quotationId: q.id,
      quotationCode: q.quotationNumber,
      customerName: q.customer?.name ?? "Enterprise Client",
      customerTier:
        (q.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER",
      salesRepName: q.salesRepId ?? "Alex Miller",
      score,
      category,
      stage: q.status,
      netTotalMinor: q.grandTotalMinor,
      marginPct: q.marginPct,
      daysInStage: q.id === "qt-103" ? 18 : q.id === "qt-104" ? 12 : 3,
      factors: {
        marginHealth: Math.min(100, Math.round((q.marginPct / 40) * 100)),
        velocityHealth: q.id === "qt-103" ? 30 : 90,
        fulfillmentHealth: qAlerts.some((a) => a.type === "DELIVERY_SLIPPAGE")
          ? 40
          : 100,
        discountCompliance: qAlerts.some((a) => a.type === "DISCOUNT_ANOMALY")
          ? 45
          : 95,
      },
      activeAlertCount: qAlerts.length,
      activeAnomalies: Array.from(new Set(qAlerts.map((a) => a.type))),
    };
  });
}

function buildMockSummary(): {
  summary: DealHealthSummary;
  scores: DealHealthScore[];
} {
  const scores = buildMockScores();
  const openAlerts = mockAlerts.filter((a) => a.status === "open");

  const healthyDealsCount = scores.filter(
    (s) => s.category === "HEALTHY",
  ).length;
  const watchDealsCount = scores.filter((s) => s.category === "WATCH").length;
  const atRiskDealsCount = scores.filter(
    (s) => s.category === "AT_RISK",
  ).length;
  const criticalDealsCount = scores.filter(
    (s) => s.category === "CRITICAL",
  ).length;

  const totalAtRiskValueMinor = scores
    .filter((s) => s.category === "CRITICAL" || s.category === "AT_RISK")
    .reduce((sum, s) => sum + s.netTotalMinor, 0);

  const anomaliesByType: Record<DealAnomalyType, number> = {
    STALLED: openAlerts.filter((a) => a.type === "STALLED").length,
    DISCOUNT_ANOMALY: openAlerts.filter((a) => a.type === "DISCOUNT_ANOMALY")
      .length,
    DELIVERY_SLIPPAGE: openAlerts.filter((a) => a.type === "DELIVERY_SLIPPAGE")
      .length,
    MARGIN_EROSION: openAlerts.filter((a) => a.type === "MARGIN_EROSION")
      .length,
  };

  return {
    summary: {
      monitoredDealsCount: SEED_QUOTATIONS.length,
      healthyDealsCount,
      watchDealsCount,
      atRiskDealsCount,
      criticalDealsCount,
      totalAtRiskValueMinor,
      openAlertsCount: openAlerts.length,
      anomaliesByType,
      lastScannedAt: new Date().toISOString(),
    },
    scores,
  };
}

export const dealHealthApi = {
  getSummary: async (): Promise<{
    summary: DealHealthSummary;
    scores: DealHealthScore[];
  }> => {
    try {
      const res = await apiClient.get(apiRoutes.dealHealth.summary.path);
      return res.data?.data ?? res.data ?? buildMockSummary();
    } catch {
      return buildMockSummary();
    }
  },

  getAlerts: async (filters?: {
    status?: DealHealthStatus;
    severity?: DealHealthSeverity;
    type?: DealAnomalyType;
    quotationId?: string;
  }): Promise<DealHealthAlert[]> => {
    try {
      const res = await apiClient.get(apiRoutes.dealHealth.alerts.path, {
        params: filters,
      });
      return res.data?.data ?? res.data ?? mockAlerts;
    } catch {
      let filtered = [...mockAlerts];
      if (filters?.status)
        filtered = filtered.filter((a) => a.status === filters.status);
      if (filters?.severity)
        filtered = filtered.filter((a) => a.severity === filters.severity);
      if (filters?.type)
        filtered = filtered.filter((a) => a.type === filters.type);
      if (filters?.quotationId)
        filtered = filtered.filter(
          (a) => a.quotationId === filters.quotationId,
        );
      return filtered;
    }
  },

  triggerScan: async (): Promise<{
    alerts: DealHealthAlert[];
    scores: DealHealthScore[];
    summary: DealHealthSummary;
  }> => {
    try {
      const res = await apiClient.post(apiRoutes.dealHealth.detect.path);
      return res.data?.data ?? res.data;
    } catch {
      const result = buildMockSummary();
      return {
        alerts: mockAlerts,
        scores: result.scores,
        summary: result.summary,
      };
    }
  },

  acknowledgeAlert: async (
    alertId: string,
    input?: AcknowledgeAlertInput,
  ): Promise<DealHealthAlert> => {
    try {
      const path = apiRoutes.dealHealth.acknowledge.path.replace(
        ":id",
        alertId,
      );
      const res = await apiClient.post(path, input);
      return res.data?.data ?? res.data;
    } catch {
      const alert = mockAlerts.find((a) => a.id === alertId);
      if (alert) {
        alert.status = "acknowledged";
        alert.acknowledgedAt = new Date().toISOString();
        if (input?.note) alert.resolutionNote = input.note;
      }
      return alert ?? mockAlerts[0]!;
    }
  },

  resolveAlert: async (
    alertId: string,
    input: ResolveAlertInput,
  ): Promise<DealHealthAlert> => {
    try {
      const path = apiRoutes.dealHealth.resolve.path.replace(":id", alertId);
      const res = await apiClient.post(path, input);
      return res.data?.data ?? res.data;
    } catch {
      const alert = mockAlerts.find((a) => a.id === alertId);
      if (alert) {
        alert.status = "resolved";
        alert.resolvedAt = new Date().toISOString();
        alert.resolutionNote = input.resolutionNote;
      }
      return alert ?? mockAlerts[0]!;
    }
  },
};
