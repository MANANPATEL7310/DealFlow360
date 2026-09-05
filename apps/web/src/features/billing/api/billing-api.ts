import {
  apiRoutes,
  type BillingSchedule,
  type Invoice,
  type Payment,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export interface SubscriptionChangeParams {
  lineId: string;
  newPeriodAmountMinor: number;
  reason: string;
  changeDate?: string;
}

export const billingApi = {
  async getSchedule(quotationId: string): Promise<BillingSchedule> {
    const { data } = await apiClient.get(
      apiRoutes.billing.schedule.path.replace(":id", quotationId),
    );
    return data.data;
  },
  async listSchedules(): Promise<BillingSchedule[]> {
    const { data } = await apiClient.get(apiRoutes.billing.list.path);
    return data.data;
  },
  async recordPayment(
    _quotationId: string,
    invoiceId: string,
    amountMinor: number,
    paymentMethod = "ACH Transfer",
    reference?: string,
  ): Promise<{
    schedule: BillingSchedule;
    invoice: Invoice;
    payment: Payment;
  }> {
    const { data } = await apiClient.post(
      apiRoutes.invoices.pay.path.replace(":invoiceId", invoiceId),
      { amountMinor, paymentMethod, reference },
    );
    return data.data;
  },
  async changeSubscription(
    quotationId: string,
    params: SubscriptionChangeParams,
  ): Promise<BillingSchedule> {
    const { data } = await apiClient.post(
      apiRoutes.billing.change.path.replace(":id", quotationId),
      params,
    );
    return data.data;
  },
};
