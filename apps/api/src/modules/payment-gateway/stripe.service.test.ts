import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../lib/db.js";
import { recordPayment } from "../billing/billing.service.js";
import {
  createCheckoutSession,
  handleStripeWebhookEvent,
  simulatePaymentSettlement,
} from "./stripe.service.js";

vi.mock("../../lib/db.js", () => ({
  db: {
    invoice: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      create: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    quotation: {
      create: vi.fn(),
    },
    billingSchedule: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../billing/billing.service.js", () => ({
  recordPayment: vi.fn(),
}));

describe("Stripe Payment Gateway", () => {
  const invoiceId = "inv-test-123";
  let mockInvoice: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockInvoice = {
      id: invoiceId,
      scheduleId: "sched-test-1",
      kind: "ONE_TIME",
      amountMinor: 10000,
      status: "ISSUED",
      payments: [],
      schedule: {
        quotationId: "q-123",
        quotation: {
          customer: {
            currency: "USD",
            contacts: [{ email: "testbuyer@payment.test" }],
          },
        },
      },
    };

    vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice as never);

    vi.mocked(recordPayment).mockImplementation(async (invId: string) => {
      mockInvoice.status = "PAID";
      return {
        id: invId,
        status: "PAID",
      } as never;
    });
  });

  it("creates a checkout session (live if secret key configured, simulation if unset)", async () => {
    const session = await createCheckoutSession(invoiceId);

    expect(session.amountDueMinor).toBe(10000);
    expect(["live", "simulation"]).toContain(session.mode);
    expect(session.checkoutUrl).toBeDefined();
    if (session.mode === "simulation") {
      expect(session.sessionId).toContain(`sim_session_${invoiceId}`);
    } else {
      expect(session.sessionId).toMatch(/^cs_test_/);
    }
  });

  it("rejects checkout session for non-existent invoice", async () => {
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce(null as never);
    await expect(
      createCheckoutSession("non-existent-invoice-id"),
    ).rejects.toThrow("INVOICE_NOT_FOUND");
  });

  it("rejects checkout session for a VOID invoice", async () => {
    mockInvoice.status = "VOID";

    await expect(createCheckoutSession(invoiceId)).rejects.toThrow(
      "INVOICE_VOID",
    );
  });

  it("handles checkout.session.completed webhook and marks invoice PAID", async () => {
    const webhookPayload = {
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: invoiceId,
          amount_total: 10000,
          metadata: { invoiceId },
        },
      },
    };

    const result = await handleStripeWebhookEvent(webhookPayload);

    expect(result).toMatchObject({
      received: true,
      invoiceId,
      amountMinor: 10000,
      status: "PAID",
    });

    expect(recordPayment).toHaveBeenCalledWith(
      invoiceId,
      10000,
      "stripe_webhook",
    );
  });

  it("safely ignores unrecognized webhook events without throwing", async () => {
    const result = await handleStripeWebhookEvent({
      type: "customer.updated",
      data: { object: {} },
    });

    expect(result).toMatchObject({ received: true, ignored: true });
  });

  it("simulates full payment settlement via helper", async () => {
    const result = await simulatePaymentSettlement(invoiceId);

    expect(result).toMatchObject({
      success: true,
      invoiceId,
      amountSettled: 10000,
      newStatus: "PAID",
    });

    expect(recordPayment).toHaveBeenCalledWith(
      invoiceId,
      10000,
      "stripe_simulation",
    );
  });
});
