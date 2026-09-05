import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { recommend } from "./controller.js";

export const aiRecommendationsRouter = createRouter();

aiRecommendationsRouter.post(
  "/recommendations/:quotationId",
  requireAuth,
  recommend,
);
