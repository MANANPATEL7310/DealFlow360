import type { ManualSplitInput } from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fulfillmentApi } from "@/features/fulfillment/api/fulfillment-api";
import { QUOTATIONS_QUERY_KEY } from "@/features/quotations/hooks/use-quotations";

export const FULFILLMENT_QUERY_KEY = ["fulfillment"] as const;

export function useFulfillmentPlan(quotationId?: string) {
  return useQuery({
    queryKey: [...FULFILLMENT_QUERY_KEY, "plan", quotationId],
    queryFn: () => (quotationId ? fulfillmentApi.getPlan(quotationId) : null),
    enabled: Boolean(quotationId),
    staleTime: 10000,
  });
}

export function useWarehouses() {
  return useQuery({
    queryKey: [...FULFILLMENT_QUERY_KEY, "warehouses"],
    queryFn: () => fulfillmentApi.getWarehouses(),
    staleTime: 60000,
  });
}

export function useAcceptPlan(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fulfillmentApi.acceptPlan(quotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FULFILLMENT_QUERY_KEY, "plan", quotationId],
      });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      toast.success("Fulfillment plan accepted and inventory reserved!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to accept fulfillment plan.");
    },
  });
}

export function useOverridePlan(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (splits: ManualSplitInput[]) =>
      fulfillmentApi.overridePlan(quotationId, splits),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FULFILLMENT_QUERY_KEY, "plan", quotationId],
      });
      toast.success("Manual warehouse allocation plan saved!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to save manual plan overrides.");
    },
  });
}

export function useConsolidateBackorder(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (backorderId: string) =>
      fulfillmentApi.consolidateBackorder(quotationId, backorderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FULFILLMENT_QUERY_KEY, "plan", quotationId],
      });
      toast.success("Backorder consolidated into active shipment!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to consolidate backorder.");
    },
  });
}
