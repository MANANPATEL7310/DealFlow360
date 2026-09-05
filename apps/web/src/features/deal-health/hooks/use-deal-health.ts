import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AcknowledgeAlertInput,
  DealAnomalyType,
  DealHealthSeverity,
  DealHealthStatus,
  ResolveAlertInput,
} from "@template/shared";
import { dealHealthApi } from "../api/deal-health-api";

export const DEAL_HEALTH_KEYS = {
  all: ["deal-health"] as const,
  summary: () => [...DEAL_HEALTH_KEYS.all, "summary"] as const,
  alerts: (filters?: {
    status?: DealHealthStatus;
    severity?: DealHealthSeverity;
    type?: DealAnomalyType;
    quotationId?: string;
  }) => [...DEAL_HEALTH_KEYS.all, "alerts", filters] as const,
};

export function useDealHealthSummary() {
  return useQuery({
    queryKey: DEAL_HEALTH_KEYS.summary(),
    queryFn: () => dealHealthApi.getSummary(),
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useDealHealthAlerts(filters?: {
  status?: DealHealthStatus;
  severity?: DealHealthSeverity;
  type?: DealAnomalyType;
  quotationId?: string;
}) {
  return useQuery({
    queryKey: DEAL_HEALTH_KEYS.alerts(filters),
    queryFn: () => dealHealthApi.getAlerts(filters),
    staleTime: 1000 * 30,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      input,
    }: {
      alertId: string;
      input?: AcknowledgeAlertInput;
    }) => dealHealthApi.acknowledgeAlert(alertId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_HEALTH_KEYS.all });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertId,
      input,
    }: {
      alertId: string;
      input: ResolveAlertInput;
    }) => dealHealthApi.resolveAlert(alertId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_HEALTH_KEYS.all });
    },
  });
}

export function useTriggerDetectionScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dealHealthApi.triggerScan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_HEALTH_KEYS.all });
    },
  });
}
