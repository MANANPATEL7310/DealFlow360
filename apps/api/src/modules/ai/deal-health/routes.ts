import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { triageAlerts } from "./controller.js";

export const aiDealHealthRouter = createRouter();

aiDealHealthRouter.post("/deal-health/triage", requireAuth, triageAlerts);
