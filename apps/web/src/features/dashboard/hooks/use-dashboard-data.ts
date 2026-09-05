import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { dashboardApi } from "../api/dashboard-api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
  recentQuotations: (limit: number) =>
    [...dashboardKeys.all, "recent-quotations", limit] as const,
  alerts: () => [...dashboardKeys.all, "alerts"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: dashboardApi.getSummary,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useRecentQuotations(limit = 6) {
  return useQuery({
    queryKey: dashboardKeys.recentQuotations(limit),
    queryFn: () => dashboardApi.getRecentQuotations(limit),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useDealHealthAlerts() {
  return useQuery({
    queryKey: dashboardKeys.alerts(),
    queryFn: dashboardApi.getAlerts,
    staleTime: 20_000,
    retry: 1,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => dashboardApi.acknowledgeAlert(alertId),
    onSuccess: () => {
      toast.success("Alert acknowledged.");
      queryClient.invalidateQueries({ queryKey: dashboardKeys.alerts() });
    },
    onError: () => {
      toast.error("Failed to acknowledge alert.");
    },
  });
}
