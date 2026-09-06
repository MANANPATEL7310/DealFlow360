import {
  CreateCheckoutSessionInputSchema,
  SimulateCheckoutInputSchema,
} from "@template/shared";
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  createCheckoutSessionController,
  simulateCheckoutController,
  stripeWebhookController,
} from "./payment-gateway.controller.js";

export const paymentGatewayRouter = createRouter();

// ── Public Webhook Receiver ──────────────────────────────────────────────────
paymentGatewayRouter.post("/stripe-webhook", stripeWebhookController);

// ── Authenticated Payment Gateway Endpoints ─────────────────────────────────
paymentGatewayRouter.post(
  "/checkout-session/:invoiceId",
  requireAuth,
  validateRequest(CreateCheckoutSessionInputSchema),
  createCheckoutSessionController,
);

paymentGatewayRouter.post(
  "/simulate-checkout",
  requireAuth,
  validateRequest(SimulateCheckoutInputSchema),
  simulateCheckoutController,
);
