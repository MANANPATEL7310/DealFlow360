import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../lib/db.js";
import {
  createCheckoutSession,
  handleStripeWebhookEvent,
  simulatePaymentSettlement,
} from "./stripe.service.js";

describe("Stripe Payment Gateway", () => {
  let customerId: string;
  let quoteId: string;
  let scheduleId: string;
  let invoiceId: string;

  beforeEach(async () => {
    // Set up test customer, quote, schedule, and invoice
    const customer = await db.customer.create({
      data: {
        name: "Payment Gateway Test Customer",
        tier: "GOLD",
        currency: "USD",
        contacts: {
          create: {
            name: "Test Buyer",
            email: "testbuyer@payment.test",
          },
        },
      },
    });
    customerId = customer.id;

    const rep =
      (await db.user.findFirst({ where: { role: "sales_rep" } })) ??
      (await db.user.create({
        data: {
          email: "rep-stripe-test@dealflow360.dev",
          name: "Stripe Test Rep",
          password: "password123",
          role: "sales_rep",
        },
      }));

    const quote = await db.quotation.create({
      data: {
        customerId,
        salesRepId: rep.id,
        status: "CONFIRMED",
        subtotalMinor: 10000,
        grandTotalMinor: 10000,
      },
    });
    quoteId = quote.id;

    const schedule = await db.billingSchedule.create({
      data: { quotationId: quoteId },
    });
    scheduleId = schedule.id;

    const invoice = await db.invoice.create({
      data: {
        scheduleId,
        kind: "ONE_TIME",
        amountMinor: 10000, // $100.00
        status: "ISSUED",
      },
    });
    invoiceId = invoice.id;
  });

  it("creates a checkout session in simulation mode when secret key is unset", async () => {
    const session = await createCheckoutSession(invoiceId);

    expect(session).toMatchObject({
      mode: "simulation",
      amountDueMinor: 10000,
      checkoutUrl: expect.stringContaining("checkout-simulation"),
    });
    expect(session.sessionId).toContain(`sim_session_${invoiceId}`);
  });

  it("rejects checkout session for non-existent invoice", async () => {
    await expect(
      createCheckoutSession("non-existent-invoice-id"),
    ).rejects.toThrow("INVOICE_NOT_FOUND");
  });

  it("rejects checkout session for a VOID invoice", async () => {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "VOID" },
    });

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

    // Verify invoice status in DB
    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoiceId },
    });
    expect(updatedInvoice?.status).toBe("PAID");
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

    const checkDb = await db.invoice.findUnique({ where: { id: invoiceId } });
    expect(checkDb?.status).toBe("PAID");
  });
});
