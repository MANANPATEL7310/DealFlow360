import { createRouter } from "../../../lib/create-router.js";
import { requireAuth } from "../../../middleware/require-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { reviewDiscountController } from "./controller.js";

export const discountApprovalRouter = createRouter();

discountApprovalRouter.use(requireAuth);

discountApprovalRouter.post(
  "/discount-approval/:quotationId",
  requireRole("sales_manager", "finance", "admin"),
  reviewDiscountController,
);
