import { apiRoutes, SEED_QUOTATIONS, type Quotation } from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export interface DashboardKpis {
  totalPipelineMinor: number;
  averageMarginPct: number;
  pendingApprovalsCount: number;
  activeBackordersCount: number;
  confirmedRevenueMinor: number;
}

export interface PipelineStageCount {
  draft: number;
  pendingApproval: number;
  approved: number;
  sent: number;
  underNegotiation: number;
  confirmed: number;
}

export interface DashboardSummaryResponse {
  kpis: DashboardKpis;
  stages: PipelineStageCount;
}

export interface QuotationSummaryItem {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerTier: "BRONZE" | "SILVER" | "GOLD";
  salesRepName: string;
  subtotalMinor: number;
  netTotalMinor: number;
  marginPct: number;
  blendedRiskScore: number;
  status: Quotation["status"];
  createdAt: string;
}

export interface DealHealthAlertItem {
  id: string;
  quotationId: string;
  quotationCode: string;
  customerName: string;
  type: "STALLED" | "DISCOUNT_ANOMALY" | "DELIVERY_SLIPPAGE";
  severity: "low" | "medium" | "high";
  detail: string;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
}

function computeMockSummary(): DashboardSummaryResponse {
  const quotes = SEED_QUOTATIONS;
  const totalPipelineMinor = quotes.reduce(
    (sum, q) => sum + (q.grandTotalMinor ?? q.subtotalMinor ?? 0),
    0,
  );
  const totalMargin = quotes.reduce((sum, q) => sum + (q.marginPct ?? 35), 0);
  const averageMarginPct =
    quotes.length > 0 ? Math.round(totalMargin / quotes.length) : 38;

  const stages: PipelineStageCount = {
    draft: quotes.filter((q) => q.status === "DRAFT").length,
    pendingApproval: quotes.filter((q) => q.status === "PENDING_APPROVAL").length,
    approved: quotes.filter((q) => q.status === "APPROVED").length,
    sent: quotes.filter((q) => q.status === "SENT").length,
    underNegotiation: quotes.filter((q) => q.status === "UNDER_NEGOTIATION").length,
    confirmed: quotes.filter((q) => q.status === "CONFIRMED").length,
  };

  return {
    kpis: {
      totalPipelineMinor,
      averageMarginPct,
      pendingApprovalsCount: stages.pendingApproval,
      activeBackordersCount: 2,
      confirmedRevenueMinor: 14200000,
    },
    stages,
  };
}

function computeMockRecentQuotations(limit = 6): QuotationSummaryItem[] {
  return SEED_QUOTATIONS.slice(0, limit).map((q) => ({
    id: q.id,
    code: q.quotationNumber,
    customerId: q.customerId,
    customerName: q.customer?.name ?? "Acme Global Solutions",
    customerTier: (q.customer?.tier as "BRONZE" | "SILVER" | "GOLD") ?? "SILVER",
    salesRepName: "Alex Miller",
    subtotalMinor: q.subtotalMinor,
    netTotalMinor: q.grandTotalMinor ?? q.subtotalMinor,
    marginPct: q.marginPct ?? 36,
    blendedRiskScore: q.blendedRiskScore ?? 0,
    status: q.status,
    createdAt: q.createdAt ?? "2026-09-04T12:00:00.000Z",
  }));
}

let localAlerts: DealHealthAlertItem[] = [
  {
    id: "alt-01",
    quotationId: "qt-102",
    quotationCode: "QT-2026-002",
    customerName: "Nordic Dynamics Oy",
    type: "DISCOUNT_ANOMALY",
    severity: "medium",
    detail: "Blended discount 16.5% exceeds Silver Tier 12.0% ceiling without VP approval.",
    status: "open",
    createdAt: "2026-09-05T09:30:00.000Z",
  },
  {
    id: "alt-02",
    quotationId: "qt-104",
    quotationCode: "QT-2026-004",
    customerName: "Vertex AI Labs",
    type: "DELIVERY_SLIPPAGE",
    severity: "high",
    detail: "Warehouse Central stock deficit (4 units awaiting inter-facility transfer).",
    status: "open",
    createdAt: "2026-09-05T11:15:00.000Z",
  },
];

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    try {
      const res = await apiClient.get(apiRoutes.dashboard.summary.path);
      return res.data?.data ?? res.data ?? computeMockSummary();
    } catch {
      return computeMockSummary();
    }
  },

  getRecentQuotations: async (limit = 5): Promise<QuotationSummaryItem[]> => {
    try {
      const res = await apiClient.get(apiRoutes.quotations.list.path, {
        params: { limit },
      });
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return computeMockRecentQuotations(limit);
    } catch {
      return computeMockRecentQuotations(limit);
    }
  },

  getAlerts: async (): Promise<DealHealthAlertItem[]> => {
    try {
      const res = await apiClient.get(apiRoutes.dealHealth.alerts.path);
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return localAlerts;
    } catch {
      return localAlerts;
    }
  },

  acknowledgeAlert: async (id: string): Promise<{ success: boolean }> => {
    try {
      const path = apiRoutes.dealHealth.acknowledge.path.replace(":id", id);
      const res = await apiClient.post(path);
      return res.data;
    } catch {
      localAlerts = localAlerts.map((a) =>
        a.id === id ? { ...a, status: "acknowledged" as const } : a,
      );
      return { success: true };
    }
  },
};
