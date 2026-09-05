// apps/api/src/modules/billing/billing.routes.ts
// === M8: Billing & Invoicing Routes ===
import {
  recordPaymentSchema,
  subscriptionChangeSchema,
} from "@template/shared";
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import {
  getBillingScheduleHandler,
  recordPaymentHandler,
  subscriptionChangeHandler,
} from "./billing.controller.js";

// ─── Quotations Billing Router (mounted at /quotations) ─────────────────────────
export const billingRouter = createRouter();
billingRouter.use(requireAuth);

billingRouter.get("/:id/billing", getBillingScheduleHandler);
billingRouter.post(
  "/:id/billing/subscription-change",
  requireRole("finance", "admin"),
  validateRequest(subscriptionChangeSchema),
  subscriptionChangeHandler,
);

// ─── Invoice Router (mounted at /invoices) ─────────────────────────────────────
export const invoiceRouter = createRouter();
invoiceRouter.use(requireAuth);

invoiceRouter.post(
  "/:invoiceId/payments",
  requireRole("finance", "admin"),
  validateRequest(recordPaymentSchema),
  recordPaymentHandler,
);
