import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import { nudgeSchema } from "./deal-health.schema.js";
import * as c from "./deal-health.controller.js";

export const dealHealthRouter = createRouter();

dealHealthRouter.use(requireAuth);

dealHealthRouter.get("/summary", c.summaryController);
dealHealthRouter.get("/alerts", c.listAlertsController);
dealHealthRouter.post(
  "/detect",
  requireRole("sales_manager", "admin"),
  c.detectController,
);
dealHealthRouter.post("/alerts/:id/acknowledge", c.acknowledgeController);
dealHealthRouter.post(
  "/alerts/:id/resolve",
  requireRole("sales_manager", "admin"),
  c.resolveController,
);
dealHealthRouter.post(
  "/alerts/:id/nudge",
  requireRole("sales_manager", "admin"),
  validateRequest(nudgeSchema),
  c.nudgeController,
);
