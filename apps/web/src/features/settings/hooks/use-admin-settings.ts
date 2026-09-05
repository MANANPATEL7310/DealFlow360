import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { AuditLogQuery } from "@template/shared";
import { adminApi } from "../api/admin-api";

const SETTINGS_QUERY_KEY = ["admin", "settings"];
const AUDIT_LOGS_QUERY_KEY = ["admin", "audit-logs"];

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => adminApi.listSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminApi.updateSetting(key, value),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: AUDIT_LOGS_QUERY_KEY });
      toast.success(`Setting "${variables.key}" updated successfully.`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update system setting.");
    },
  });
}

export function useAuditLogs(filters: AuditLogQuery = {}) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, filters],
    queryFn: () => adminApi.listAuditLogs(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}
