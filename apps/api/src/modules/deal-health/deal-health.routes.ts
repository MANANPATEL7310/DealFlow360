import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  acknowledgeAlertController,
  getDealHealthAlertsController,
  getDealHealthSummaryController,
  resolveAlertController,
  triggerDetectionScanController,
} from "./deal-health.controller.js";

export const dealHealthRouter = createRouter();

// All deal-health routes require internal authenticated session
dealHealthRouter.use(requireAuth);

dealHealthRouter.get("/summary", getDealHealthSummaryController);
dealHealthRouter.get("/alerts", getDealHealthAlertsController);
dealHealthRouter.post("/detect", triggerDetectionScanController);
dealHealthRouter.post("/alerts/:id/acknowledge", acknowledgeAlertController);
dealHealthRouter.post("/alerts/:id/resolve", resolveAlertController);
