import Stripe from "stripe";
import { env } from "../../config/env.js";
import { db } from "../../lib/db.js";
import { recordPayment } from "../billing/billing.service.js";

// Initialize official Stripe client if API key is provided
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY)
  : null;

export async function createCheckoutSession(
  invoiceId: string,
  options?: { successUrl?: string; cancelUrl?: string },
) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      schedule: {
        include: {
          quotation: {
            include: {
              customer: {
                include: {
                  contacts: true,
                },
              },
            },
          },
        },
      },
      payments: true,
    },
  });

  if (!invoice) {
    throw Object.assign(new Error("INVOICE_NOT_FOUND"), { http: 404 });
  }
  if (invoice.status === "PAID") {
    throw Object.assign(new Error("INVOICE_ALREADY_PAID"), { http: 400 });
  }
  if (invoice.status === "VOID") {
    throw Object.assign(new Error("INVOICE_VOID"), { http: 409 });
  }

  const paidMinor = invoice.payments
    .filter((p) => p.status === "recorded")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const amountDueMinor = Math.max(0, invoice.amountMinor - paidMinor);
  if (amountDueMinor === 0) {
    throw Object.assign(new Error("INVOICE_ALREADY_PAID"), { http: 400 });
  }

  const currency = (
    invoice.schedule?.quotation?.customer?.currency ?? "usd"
  ).toLowerCase();

  // If live Stripe is configured, create real Stripe Checkout Session
  if (stripe) {
    const customerEmail =
      invoice.schedule?.quotation?.customer?.contacts?.[0]?.email ?? undefined;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Invoice #${invoice.id.slice(-8).toUpperCase()}`,
              description: `Quotation ${invoice.schedule?.quotationId ?? ""} (${invoice.kind})`,
            },
            unit_amount: amountDueMinor,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,

      metadata: {
        invoiceId: invoice.id,
        quotationId: invoice.schedule?.quotationId ?? "",
        scheduleId: invoice.scheduleId,
      },
      success_url:
        options?.successUrl ??
        env.STRIPE_SUCCESS_URL ??
        `${env.WEB_ORIGIN}/invoices/${invoice.id}/paid?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        options?.cancelUrl ??
        env.STRIPE_CANCEL_URL ??
        `${env.WEB_ORIGIN}/invoices/${invoice.id}`,
    });

    return {
      mode: "live" as const,
      sessionId: session.id,
      checkoutUrl: session.url,
      amountDueMinor,
    };
  }

  // Simulator mode when Stripe keys are not configured
  return {
    mode: "simulation" as const,
    sessionId: `sim_session_${invoice.id}_${Date.now()}`,
    checkoutUrl: `${env.WEB_ORIGIN}/invoices/${invoice.id}/checkout-simulation?amountMinor=${amountDueMinor}`,
    amountDueMinor,
    message:
      "Stripe running in Simulation Mode (no STRIPE_SECRET_KEY configured). Use /api/v1/payments/simulate-checkout to test payment completion.",
  };
}

export async function handleStripeWebhookEvent(
  payload: string | Buffer | Record<string, unknown>,
  signature?: string,
) {
  let event:
    | Stripe.Event
    | { type: string; id?: string; data: { object: Record<string, unknown> } };

  // Live mode: require a verified signature. Without one, the payload is not
  // trustworthy — anyone could POST a fake "checkout.session.completed" and
  // mark arbitrary invoices PAID. Reject rather than trust unsigned input.
  if (stripe && env.STRIPE_WEBHOOK_SECRET) {
    if (!signature) {
      throw Object.assign(new Error("WEBHOOK_SIGNATURE_MISSING"), {
        http: 400,
      });
    }
    event = stripe.webhooks.constructEvent(
      payload as string | Buffer,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } else {
    // Simulation mode (no Stripe secret configured). The raw-body middleware
    // delivers a Buffer; parse it. This branch is only reachable when the
    // deployment has explicitly opted out of live Stripe.
    if (typeof payload === "string") {
      event = JSON.parse(payload);
    } else if (Buffer.isBuffer(payload)) {
      event = JSON.parse(payload.toString("utf-8"));
    } else {
      event = payload as {
        type: string;
        data: { object: Record<string, unknown> };
      };
    }
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "payment_intent.succeeded"
  ) {
    const session = event.data.object as Record<string, unknown>;
    const metadata = (session.metadata ?? {}) as Record<string, string>;
    const invoiceId =
      metadata.invoiceId ?? (session.client_reference_id as string);
    const amountMinor =
      (session.amount_total as number) ??
      (session.amount as number) ??
      (session.amount_received as number);

    // Prefer a stable external id for idempotency across Stripe retries.
    const externalRef =
      (session.id as string) ??
      (typeof event === "object" && "id" in event
        ? (event.id as string)
        : undefined) ??
      null;

    if (invoiceId && typeof amountMinor === "number") {
      const { invoice: updatedInvoice } = await recordPayment(
        invoiceId,
        amountMinor,
        "stripe_webhook",
        { paymentMethod: "Stripe", externalRef },
      );
      return {
        received: true,
        invoiceId,
        amountMinor,
        status: updatedInvoice.status,
      };
    }
  }

  return { received: true, ignored: true };
}

export async function simulatePaymentSettlement(
  invoiceId: string,
  amountMinor?: number,
  actorId = "stripe_simulation",
) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw Object.assign(new Error("INVOICE_NOT_FOUND"), { http: 404 });
  }

  const paidSoFar = invoice.payments
    .filter((p) => p.status === "recorded")
    .reduce((sum, p) => sum + p.amountMinor, 0);

  const settleAmount =
    amountMinor ?? Math.max(0, invoice.amountMinor - paidSoFar);

  const { invoice: updatedInvoice } = await recordPayment(
    invoiceId,
    settleAmount,
    actorId,
    { paymentMethod: "Stripe (simulated)" },
  );

  return {
    success: true,
    invoiceId: updatedInvoice.id,
    amountSettled: settleAmount,
    newStatus: updatedInvoice.status,
  };
}
