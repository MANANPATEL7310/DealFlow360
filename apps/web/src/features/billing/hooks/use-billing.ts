import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  billingApi,
  type SubscriptionChangeParams,
} from "../api/billing-api";

export const billingKeys = {
  all: ["billing"] as const,
  lists: () => [...billingKeys.all, "list"] as const,
  detail: (quotationId: string) => [...billingKeys.all, "detail", quotationId] as const,
};

/**
 * Hook to retrieve the complete billing schedule for a quotation.
 */
export function useBillingSchedule(quotationId: string) {
  return useQuery({
    queryKey: billingKeys.detail(quotationId),
    queryFn: () => billingApi.getSchedule(quotationId),
    enabled: Boolean(quotationId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to list all platform billing schedules for the operations dashboard.
 */
export function useAllBillingSchedules() {
  return useQuery({
    queryKey: billingKeys.lists(),
    queryFn: () => billingApi.listSchedules(),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to record payment against an ISSUED invoice.
 */
export function useRecordPayment(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      amountMinor,
      paymentMethod,
      reference,
    }: {
      invoiceId: string;
      amountMinor: number;
      paymentMethod?: string;
      reference?: string;
    }) =>
      billingApi.recordPayment(
        quotationId,
        invoiceId,
        amountMinor,
        paymentMethod,
        reference,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: billingKeys.detail(quotationId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", quotationId] });
      toast.success(
        `Payment recorded: $${(data.payment.amountMinor / 100).toFixed(2)} (${data.invoice.status})`,
      );
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to record invoice payment.";
      toast.error(`Payment failed: ${message}`);
    },
  });
}

/**
 * Hook to execute a mid-cycle subscription change or cancellation with proration.
 */
export function useSubscriptionChange(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SubscriptionChangeParams) =>
      billingApi.changeSubscription(quotationId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.detail(quotationId) });
      queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Subscription schedule updated with proration");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update subscription schedule.";
      toast.error(`Schedule update failed: ${message}`);
    },
  });
}
