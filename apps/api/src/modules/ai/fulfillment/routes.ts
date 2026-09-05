import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { planFulfillment } from "./controller.js";

export const aiFulfillmentRouter = createRouter();

aiFulfillmentRouter.post(
  "/fulfillment/:quotationId",
  requireAuth,
  requireRole("sales_manager", "admin"),
  planFulfillment,
);
