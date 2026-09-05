import { apiRoutes } from "@template/shared";
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
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "SENT"
    | "UNDER_NEGOTIATION"
    | "CONFIRMED"
    | "REJECTED";
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

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    const res = await apiClient.get(apiRoutes.dashboard.summary.path);
    return res.data?.data ?? res.data;
  },

  getRecentQuotations: async (limit = 5): Promise<QuotationSummaryItem[]> => {
    const res = await apiClient.get(apiRoutes.quotations.list.path, {
      params: { limit },
    });
    return res.data?.data ?? res.data ?? [];
  },

  getAlerts: async (): Promise<DealHealthAlertItem[]> => {
    const res = await apiClient.get(apiRoutes.dealHealth.alerts.path);
    return res.data?.data ?? res.data ?? [];
  },

  acknowledgeAlert: async (id: string): Promise<{ success: boolean }> => {
    const path = apiRoutes.dealHealth.acknowledge.path.replace(":id", id);
    const res = await apiClient.post(path);
    return res.data;
  },
};
