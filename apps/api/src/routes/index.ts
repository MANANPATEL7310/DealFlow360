import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { dealHealthRouter } from "../modules/deal-health/deal-health.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
import { portalRouter } from "../modules/portal/portal.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/portal", portalRouter);
apiRouter.use("/deal-health", dealHealthRouter);
apiRouter.use("/reports", reportsRouter);
