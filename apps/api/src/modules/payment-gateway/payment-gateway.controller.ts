import type { Request, Response } from "express";
import { sendCreated, sendOk } from "../../lib/response.js";
import {
  createCheckoutSession,
  handleStripeWebhookEvent,
  simulatePaymentSettlement,
} from "./stripe.service.js";

export async function createCheckoutSessionController(
  req: Request,
  res: Response,
) {
  const invoiceId = req.params.invoiceId as string;
  const { successUrl, cancelUrl } = req.body ?? {};

  const session = await createCheckoutSession(invoiceId, {
    successUrl,
    cancelUrl,
  });

  return sendOk(res, session, "Checkout session created successfully.");
}

export async function stripeWebhookController(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string | undefined;

  // The stripe-webhook route uses express.raw(), so req.body is a Buffer that
  // preserves the exact bytes Stripe signed. handleStripeWebhookEvent verifies
  // the signature against it (live mode) or parses it (simulation mode).
  const result = await handleStripeWebhookEvent(req.body, signature);

  return sendOk(res, result);
}

export async function simulateCheckoutController(req: Request, res: Response) {
  const { invoiceId, amountMinor } = req.body as {
    invoiceId: string;
    amountMinor?: number;
  };

  const result = await simulatePaymentSettlement(
    invoiceId,
    amountMinor,
    req.user?.sub ?? "simulation",
  );

  return sendCreated(res, result, "Simulated payment settled successfully.");
}
