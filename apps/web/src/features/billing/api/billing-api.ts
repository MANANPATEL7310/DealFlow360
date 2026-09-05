import {
  apiRoutes,
  type BillingSchedule,
  type CreditNote,
  type Invoice,
  type Payment,
  prorate,
  remainingMinor,
  SEED_BILLING_SCHEDULES,
} from "@template/shared";
import { quotationsApi } from "@/features/quotations/api/quotations-api";
import { apiClient } from "@/services/http/api-client";

// In-memory persistent state for billing schedules
const localSchedules: BillingSchedule[] = JSON.parse(
  JSON.stringify(SEED_BILLING_SCHEDULES),
);

export interface SubscriptionChangeParams {
  lineId: string;
  newPeriodAmountMinor: number;
  reason: string;
  changeDate?: string;
}

export const billingApi = {
  /**
   * Retrieves billing schedule for a given quotation.
   * Auto-generates a schedule from quotation lines if one does not already exist.
   */
  async getSchedule(quotationId: string): Promise<BillingSchedule> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.billing.schedule.path.replace(":id", quotationId),
      );
      return data.data;
    } catch {
      const existing = localSchedules.find(
        (s) => s.quotationId === quotationId,
      );
      if (existing) {
        return existing;
      }

      // Generate a schedule from the quotation
      const quotation = await quotationsApi.getQuotationById(quotationId);
      if (!quotation) {
        throw new Error(`Quotation ${quotationId} not found`);
      }

      const scheduleId = `sch-${quotationId}-${Date.now()}`;
      const now = new Date();
      const isoNow = now.toISOString();

      // 1. One-time lines aggregation
      const oneTimeLines = quotation.lines.filter(
        (l) => l.lineType !== "RECURRING" && !l.subscriptionPlanId,
      );
      const oneTimeTotalMinor = oneTimeLines.reduce((sum, l) => {
        const lineNet = Math.round(
          l.qty * l.unitPriceMinor * (1 - (l.discountPct ?? 0) / 100),
        );
        return sum + lineNet;
      }, 0);

      const invoices: Invoice[] = [];

      if (oneTimeTotalMinor > 0) {
        invoices.push({
          id: `inv-${quotationId}-ot`,
          scheduleId,
          kind: "ONE_TIME",
          lineId: null,
          periodStart: null,
          periodEnd: null,
          amountMinor: oneTimeTotalMinor,
          status: "ISSUED",
          payments: [],
          createdAt: isoNow,
          updatedAt: isoNow,
        });
      }

      // 2. Recurring subscription lines
      const recurringLines = quotation.lines.filter(
        (l) => l.lineType === "RECURRING" || !!l.subscriptionPlanId,
      );

      for (const line of recurringLines) {
        const lineMonthlyMinor = Math.round(
          line.qty * line.unitPriceMinor * (1 - (line.discountPct ?? 0) / 100),
        );
        // Generate 6 upcoming monthly periods
        for (let m = 0; m < 6; m++) {
          const pStart = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + m, 1),
          );
          const pEnd = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() + m + 1,
              0,
              23,
              59,
              59,
            ),
          );

          invoices.push({
            id: `inv-${quotationId}-${line.id}-m${m + 1}`,
            scheduleId,
            kind: "RECURRING",
            lineId: line.id,
            periodStart: pStart.toISOString(),
            periodEnd: pEnd.toISOString(),
            amountMinor: lineMonthlyMinor,
            status: m === 0 ? "ISSUED" : "DRAFT",
            payments: [],
            createdAt: isoNow,
            updatedAt: isoNow,
          });
        }
      }

      const newSchedule: BillingSchedule = {
        id: scheduleId,
        quotationId,
        invoices,
        creditNotes: [],
        createdAt: isoNow,
        updatedAt: isoNow,
      };

      localSchedules.push(newSchedule);
      return newSchedule;
    }
  },

  /**
   * Retrieves all billing schedules for platform-wide operations view.
   */
  async listSchedules(): Promise<BillingSchedule[]> {
    return localSchedules;
  },

  /**
   * Records a payment against an ISSUED invoice.
   */
  async recordPayment(
    quotationId: string,
    invoiceId: string,
    amountMinor: number,
    paymentMethod = "ACH Transfer",
    reference?: string,
  ): Promise<{
    schedule: BillingSchedule;
    invoice: Invoice;
    payment: Payment;
  }> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.invoices.pay.path.replace(":id", invoiceId),
        { amountMinor, paymentMethod, reference },
      );
      return data.data;
    } catch {
      const schedule = localSchedules.find(
        (s) => s.quotationId === quotationId,
      );
      if (!schedule) {
        throw new Error(`Schedule not found for quotation ${quotationId}`);
      }

      const invoice = schedule.invoices.find((i) => i.id === invoiceId);
      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      if (invoice.status === "VOID" || invoice.status === "PAID") {
        throw new Error(`Invoice is already ${invoice.status}`);
      }

      const due = remainingMinor(invoice);
      if (amountMinor <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }
      if (amountMinor > due) {
        throw new Error(
          `Payment cannot exceed outstanding balance of $${(due / 100).toFixed(2)}`,
        );
      }

      const now = new Date().toISOString();
      const payment: Payment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        invoiceId,
        amountMinor,
        paymentMethod,
        reference:
          reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        status: "recorded",
        createdAt: now,
        updatedAt: now,
      };

      invoice.payments.push(payment);
      invoice.updatedAt = now;

      if (remainingMinor(invoice) === 0) {
        invoice.status = "PAID";
      }

      // Check if all invoices are paid
      const nonVoidInvoices = schedule.invoices.filter(
        (i) => i.status !== "VOID",
      );
      const allPaid =
        nonVoidInvoices.length > 0 &&
        nonVoidInvoices.every((i) => i.status === "PAID");

      if (allPaid) {
        try {
          await quotationsApi.updateQuotation(quotationId, { status: "PAID" });
        } catch {
          // Ignore if already paid or in mock mode
        }
      }

      schedule.updatedAt = now;
      return { schedule, invoice, payment };
    }
  },

  /**
   * Modifies or cancels a subscription line with pure mid-cycle proration.
   */
  async changeSubscription(
    quotationId: string,
    params: SubscriptionChangeParams,
  ): Promise<BillingSchedule> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.billing.change.path.replace(":id", quotationId),
        params,
      );
      return data.data;
    } catch {
      const schedule = localSchedules.find(
        (s) => s.quotationId === quotationId,
      );
      if (!schedule) {
        throw new Error(`Schedule not found for quotation ${quotationId}`);
      }

      const lineInvoices = schedule.invoices.filter(
        (i) => i.kind === "RECURRING" && i.lineId === params.lineId,
      );
      if (lineInvoices.length === 0) {
        throw new Error(
          `No recurring subscription invoices found for line ${params.lineId}`,
        );
      }

      const now = params.changeDate ? new Date(params.changeDate) : new Date();
      const isoNow = now.toISOString();

      // Identify current active period (ISSUED) and future periods (DRAFT)
      const currentPeriod =
        lineInvoices.find((i) => i.status === "ISSUED") ?? lineInvoices[0];
      const futurePeriods = lineInvoices.filter((i) => i.status === "DRAFT");

      if (!currentPeriod) {
        throw new Error("No active subscription period found to modify");
      }

      const pStart = currentPeriod.periodStart
        ? new Date(currentPeriod.periodStart)
        : now;
      const pEnd = currentPeriod.periodEnd
        ? new Date(currentPeriod.periodEnd)
        : now;

      // 1. CANCELLATION (newPeriodAmountMinor === 0)
      if (params.newPeriodAmountMinor === 0) {
        // Void all future DRAFT invoices
        for (const draft of futurePeriods) {
          draft.status = "VOID";
          draft.updatedAt = isoNow;
        }

        // Calculate unearned portion of current period for credit note
        const unearnedCreditMinor = prorate(
          currentPeriod.amountMinor,
          now,
          pStart,
          pEnd,
        );

        if (unearnedCreditMinor > 0) {
          const creditNote: CreditNote = {
            id: `cn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            scheduleId: schedule.id,
            reason:
              params.reason || "Mid-cycle subscription cancellation proration",
            amountMinor: unearnedCreditMinor,
            sourceInvoiceId: currentPeriod.id,
            createdAt: isoNow,
            updatedAt: isoNow,
          };
          schedule.creditNotes.push(creditNote);
        }
      }
      // 2. UPGRADE (newPeriodAmountMinor > current)
      else if (params.newPeriodAmountMinor > currentPeriod.amountMinor) {
        const delta = params.newPeriodAmountMinor - currentPeriod.amountMinor;
        const catchUpMinor = prorate(delta, now, pStart, pEnd);

        if (catchUpMinor > 0) {
          schedule.invoices.push({
            id: `inv-${quotationId}-${params.lineId}-catchup-${Date.now()}`,
            scheduleId: schedule.id,
            kind: "RECURRING",
            lineId: params.lineId,
            periodStart: now.toISOString(),
            periodEnd: pEnd.toISOString(),
            amountMinor: catchUpMinor,
            status: "ISSUED",
            payments: [],
            createdAt: isoNow,
            updatedAt: isoNow,
          });
        }

        // Update future DRAFT invoices
        for (const draft of futurePeriods) {
          draft.amountMinor = params.newPeriodAmountMinor;
          draft.updatedAt = isoNow;
        }
      }
      // 3. DOWNGRADE (newPeriodAmountMinor < current)
      else if (params.newPeriodAmountMinor < currentPeriod.amountMinor) {
        const delta = currentPeriod.amountMinor - params.newPeriodAmountMinor;
        const refundMinor = prorate(delta, now, pStart, pEnd);

        if (refundMinor > 0) {
          const creditNote: CreditNote = {
            id: `cn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            scheduleId: schedule.id,
            reason:
              params.reason ||
              "Mid-cycle subscription seat downgrade proration",
            amountMinor: refundMinor,
            sourceInvoiceId: currentPeriod.id,
            createdAt: isoNow,
            updatedAt: isoNow,
          };
          schedule.creditNotes.push(creditNote);
        }

        // Update future DRAFT invoices
        for (const draft of futurePeriods) {
          draft.amountMinor = params.newPeriodAmountMinor;
          draft.updatedAt = isoNow;
        }
      }

      schedule.updatedAt = isoNow;
      return schedule;
    }
  },
};
