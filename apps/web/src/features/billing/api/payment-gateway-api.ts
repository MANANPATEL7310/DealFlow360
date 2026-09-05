import {
  apiRoutes,
  type CreateCheckoutSessionResponse,
  type SimulateCheckoutResponse,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const paymentGatewayApi = {
  /**
   * Initiates a Stripe Checkout session or simulation session for an invoice.
   */
  async createCheckoutSession(
    invoiceId: string,
    options?: { successUrl?: string; cancelUrl?: string },
  ): Promise<CreateCheckoutSessionResponse> {
    const url = apiRoutes.payments.createCheckoutSession.path.replace(
      ":invoiceId",
      invoiceId,
    );
    const { data } = await apiClient.post(url, options ?? {});
    return data.data ?? data;
  },

  /**
   * Simulates immediate automated card settlement for an invoice.
   */
  async simulateCheckout(
    invoiceId: string,
    amountMinor?: number,
  ): Promise<SimulateCheckoutResponse> {
    const url = apiRoutes.payments.simulateCheckout.path;
    const { data } = await apiClient.post(url, {
      invoiceId,
      amountMinor,
    });
    return data.data ?? data;
  },
};
