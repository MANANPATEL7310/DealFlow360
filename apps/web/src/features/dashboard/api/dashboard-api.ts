import { apiRoutes, type Quotation } from "@template/shared";
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

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryResponse> {
    const { data } = await apiClient.get(apiRoutes.dashboard.summary.path);
    return data.data;
  },
  async getRecentQuotations(limit = 5): Promise<QuotationSummaryItem[]> {
    const { data } = await apiClient.get(apiRoutes.dashboard.recent.path, {
      params: { limit },
    });
    return data.data;
  },
  async getAlerts(): Promise<DealHealthAlertItem[]> {
    const { data } = await apiClient.get(apiRoutes.dealHealth.alerts.path, {
      params: { status: "open" },
    });
    return data.data;
  },
  async acknowledgeAlert(id: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.post(
      apiRoutes.dealHealth.acknowledge.path.replace(":id", id),
    );
    return data;
  },
};
