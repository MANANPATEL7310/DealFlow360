import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { explainBill } from "./controller.js";

export const aiBillingRouter = createRouter();

aiBillingRouter.post("/billing/:quotationId/explain", requireAuth, explainBill);
