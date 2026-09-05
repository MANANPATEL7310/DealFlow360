import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { salesReportController } from "./reports.controller.js";

export const reportsRouter = createRouter();

reportsRouter.use(requireAuth);

reportsRouter.get("/sales", salesReportController);
