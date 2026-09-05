import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { salesReport } from "./reports.controller.js";
import { exportPdf, exportXlsx } from "./reports.export.controller.js";

export const reportsRouter = createRouter();

reportsRouter.use(requireAuth);

reportsRouter.get("/sales", salesReport);
reportsRouter.get("/sales/export.xlsx", exportXlsx);
reportsRouter.get("/sales/export.pdf", exportPdf);
