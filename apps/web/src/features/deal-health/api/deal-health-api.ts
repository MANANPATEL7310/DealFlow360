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
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const dealHealthApi = {
  async getSummary(): Promise<{
    summary: DealHealthSummary;
    scores: DealHealthScore[];
  }> {
    const { data } = await apiClient.get(apiRoutes.dealHealth.summary.path);
    return data.data;
  },
  async getAlerts(filters?: {
    status?: DealHealthStatus;
    severity?: DealHealthSeverity;
    type?: DealAnomalyType;
    quotationId?: string;
  }): Promise<DealHealthAlert[]> {
    const { data } = await apiClient.get(apiRoutes.dealHealth.alerts.path, {
      params: filters,
    });
    return data.data;
  },
  async triggerScan() {
    const { data } = await apiClient.post(apiRoutes.dealHealth.detect.path);
    return data.data;
  },
  async acknowledgeAlert(
    alertId: string,
    input?: AcknowledgeAlertInput,
  ): Promise<DealHealthAlert> {
    const { data } = await apiClient.post(
      apiRoutes.dealHealth.acknowledge.path.replace(":id", alertId),
      input,
    );
    return data.data;
  },
  async resolveAlert(
    alertId: string,
    input: ResolveAlertInput,
  ): Promise<DealHealthAlert> {
    const { data } = await apiClient.post(
      apiRoutes.dealHealth.resolve.path.replace(":id", alertId),
      input,
    );
    return data.data;
  },
};
