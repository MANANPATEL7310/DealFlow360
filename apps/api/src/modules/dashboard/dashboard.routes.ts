import { requireAuth } from "../../middleware/require-auth.js";
import { createRouter } from "../../lib/create-router.js";
import {
  dashboardSummaryController,
  recentQuotationsController,
} from "./dashboard.controller.js";

export const dashboardRouter = createRouter();

dashboardRouter.get("/summary", requireAuth, dashboardSummaryController);
dashboardRouter.get(
  "/recent-quotations",
  requireAuth,
  recentQuotationsController,
);
