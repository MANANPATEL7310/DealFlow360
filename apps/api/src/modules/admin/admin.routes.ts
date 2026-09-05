import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import { updateSettingSchema } from "./admin.schema.js";
import {
  aiUsageSummaryController,
  listAuditLogsController,
  listSettingsController,
  updateSettingController,
} from "./admin.controller.js";

export const adminRouter = createRouter();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/audit-logs", listAuditLogsController);
adminRouter.get("/ai-usage", aiUsageSummaryController);
adminRouter.get("/settings", listSettingsController);
adminRouter.put(
  "/settings/:key",
  validateRequest(updateSettingSchema),
  updateSettingController,
);
