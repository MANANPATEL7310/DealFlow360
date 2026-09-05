// apps/api/src/modules/quotation/quotation.routes.ts
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import * as c from "./quotation.controller.js";
import {
  addLineSchema,
  createQuotationSchema,
  decisionSchema,
  updateLineSchema,
} from "./quotation.schema.js";

export const quotationRouter = createRouter();

// All quotation routes require authentication
quotationRouter.use(requireAuth);

// ── Quotation CRUD ────────────────────────────────────────────────────────────
quotationRouter.get("/", c.listQuotationsController);
quotationRouter.get("/:id", c.getQuotationController);
quotationRouter.post(
  "/",
  validateRequest(createQuotationSchema),
  c.createQuotationController,
);

// ── Quotation Lines ───────────────────────────────────────────────────────────
quotationRouter.post(
  "/:id/lines",
  validateRequest(addLineSchema),
  c.addLineController,
);
quotationRouter.patch(
  "/:id/lines/:lineId",
  validateRequest(updateLineSchema),
  c.updateLineController,
);
quotationRouter.delete("/:id/lines/:lineId", c.deleteLineController);

// ── Confirm (Risk & Routing Trigger) ──────────────────────────────────────────
quotationRouter.post("/:id/confirm", c.confirmController);

// ── Approvals Decision (Sales Manager, Finance, Admin) ────────────────────────
quotationRouter.post(
  "/:id/approvals/decision",
  requireRole("sales_manager", "finance", "admin"),
  validateRequest(decisionSchema),
  c.decisionController,
);
