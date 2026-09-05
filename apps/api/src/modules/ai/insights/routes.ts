import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { queryInsights } from "./controller.js";

export const aiInsightsRouter = createRouter();

aiInsightsRouter.post("/insights/query", requireAuth, queryInsights);
