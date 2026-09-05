import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import {
  listApprovalsController,
  decideApprovalController,
} from "./approvals.controller.js";

export const aiApprovalsRouter = createRouter();

aiApprovalsRouter.use(requireAuth);

aiApprovalsRouter.get("/approvals", listApprovalsController);
aiApprovalsRouter.post("/approvals/:id/decision", decideApprovalController);
