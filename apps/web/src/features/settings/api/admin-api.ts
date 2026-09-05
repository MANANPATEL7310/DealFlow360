import {
  apiRoutes,
  type AuditLog,
  type AuditLogQuery,
  type SystemSetting,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const adminApi = {
  async listSettings(): Promise<SystemSetting[]> {
    const { data } = await apiClient.get(apiRoutes.admin.settings.path);
    return data.data;
  },
  async updateSetting(key: string, value: unknown): Promise<SystemSetting> {
    const { data } = await apiClient.put(
      apiRoutes.admin.updateSetting.path.replace(":key", key),
      { value },
    );
    return data.data;
  },
  async listAuditLogs(
    filters: AuditLogQuery = {},
  ): Promise<{
    items: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { data } = await apiClient.get(apiRoutes.admin.auditLogs.path, {
      params: filters,
    });
    return data.data;
  },
};
