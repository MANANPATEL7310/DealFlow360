import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import * as c from "./fulfillment.controller.js";
import { overrideFulfillmentSchema } from "./fulfillment.schema.js";

export const fulfillmentRouter = createRouter();

const canManageFulfillment = requireRole("sales_manager", "admin");

fulfillmentRouter.use(requireAuth);

fulfillmentRouter.get("/:id/fulfillment", c.getFulfillmentPlanController);
fulfillmentRouter.post(
  "/:id/fulfillment",
  canManageFulfillment,
  c.moveToFulfillmentController,
);
fulfillmentRouter.post(
  "/:id/fulfillment/accept",
  canManageFulfillment,
  c.acceptPlanController,
);
fulfillmentRouter.post(
  "/:id/fulfillment/override",
  canManageFulfillment,
  validateRequest(overrideFulfillmentSchema),
  c.overridePlanController,
);
fulfillmentRouter.post(
  "/:id/backorders/:backorderId/consolidate",
  canManageFulfillment,
  c.consolidateBackorderController,
);
