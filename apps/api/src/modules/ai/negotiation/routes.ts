import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { assistNegotiationController } from "./controller.js";

export const negotiationRouter = createRouter();

negotiationRouter.use(requireAuth);

negotiationRouter.post(
  "/negotiation/:requestId",
  requireRole("sales_rep", "sales_manager", "admin"),
  assistNegotiationController,
);
