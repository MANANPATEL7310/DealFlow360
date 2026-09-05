import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentGatewayApi } from "../api/payment-gateway-api";
import { billingKeys } from "./use-billing";

export function useCreateCheckoutSession(quotationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      options,
    }: {
      invoiceId: string;
      options?: { successUrl?: string; cancelUrl?: string };
    }) => paymentGatewayApi.createCheckoutSession(invoiceId, options),
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create checkout session");
    },
    onSuccess: (res) => {
      if (quotationId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.detail(quotationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
      if (res.mode === "live" && res.checkoutUrl) {
        toast.loading("Redirecting to secure Stripe Checkout...", {
          duration: 2000,
        });
        window.location.href = res.checkoutUrl;
      }
    },
  });
}

export function useSimulateCheckout(quotationId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      invoiceId,
      amountMinor,
    }: {
      invoiceId: string;
      amountMinor?: number;
    }) => paymentGatewayApi.simulateCheckout(invoiceId, amountMinor),
    onSuccess: (data) => {
      if (quotationId) {
        queryClient.invalidateQueries({
          queryKey: billingKeys.detail(quotationId),
        });
      }
      queryClient.invalidateQueries({ queryKey: billingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      const dollars = (data.amountSettled / 100).toFixed(2);
      toast.success(
        `Payment settled: $${dollars} via Stripe Gateway Simulator`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to simulate payment settlement");
    },
  });
}
