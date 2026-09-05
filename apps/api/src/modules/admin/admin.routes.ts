import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  listAuditLogsController,
  listSettingsController,
  updateSettingController,
} from "./admin.controller.js";

export const adminRouter = createRouter();

adminRouter.use(requireAuth);

adminRouter.get("/settings", listSettingsController);
adminRouter.put("/settings/:key", updateSettingController);
adminRouter.get("/audit-logs", listAuditLogsController);
