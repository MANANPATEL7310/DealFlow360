import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
// === M1: Products & Price Lists (Dev 2) ===
import { productRouter } from "../modules/product/product.routes.js";
import { priceListRouter } from "../modules/product/price-list.routes.js";
// === M2: Customers (Dev 2) ===
import { customerRouter } from "../modules/customer/customer.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
// === M1 ===
apiRouter.use("/products", productRouter);
apiRouter.use("/price-lists", priceListRouter);
// === M2 ===
apiRouter.use("/customers", customerRouter);
