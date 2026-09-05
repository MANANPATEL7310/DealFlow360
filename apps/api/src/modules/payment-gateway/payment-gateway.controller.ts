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
  const invoiceId = (req.params.id || req.params.invoiceId) as string;
  const { successUrl, cancelUrl } = req.body ?? {};

  const session = await createCheckoutSession(invoiceId, {
    successUrl,
    cancelUrl,
  });

  return sendOk(res, session, "Checkout session created successfully.");
}

export async function stripeWebhookController(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string | undefined;

  const result = await handleStripeWebhookEvent(req.body, signature);

  return sendOk(res, result);
}

export async function simulateCheckoutController(req: Request, res: Response) {
  const { invoiceId, amountMinor } = req.body ?? {};

  if (!invoiceId) {
    throw Object.assign(new Error("Missing invoiceId"), { http: 400 });
  }

  const result = await simulatePaymentSettlement(
    invoiceId,
    amountMinor,
    req.user?.sub ?? "simulation",
  );

  return sendCreated(res, result, "Simulated payment settled successfully.");
}
