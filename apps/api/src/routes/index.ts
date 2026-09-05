import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { governanceRouter } from "../modules/governance/governance.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
// === M1: Products & Price Lists (Dev 2) ===
import { productRouter } from "../modules/product/product.routes.js";
import { priceListRouter } from "../modules/product/price-list.routes.js";
// === M2: Customers (Dev 2) ===
import { customerRouter } from "../modules/customer/customer.routes.js";
// === M5: Quotations (Dev 1) ===
import { quotationRouter } from "../modules/quotation/quotation.routes.js";
// === M6: Upsell & Cross-sell (Dev 2) ===
import { upsellRouter } from "../modules/upsell/upsell.routes.js";
// === M8: Hybrid Billing & Invoicing (Dev 2) ===
import {
  billingRouter,
  invoiceRouter,
} from "../modules/billing/billing.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
// === M1 ===
apiRouter.use("/products", productRouter);
apiRouter.use("/price-lists", priceListRouter);
// === M2 ===
apiRouter.use("/customers", customerRouter);
// === M3 (Dev 1) ===
apiRouter.use("/governance", governanceRouter);
// === M5 (Dev 1) ===
apiRouter.use("/quotations", quotationRouter);
// === M6 (Dev 2) — second router on /quotations for upsell sub-routes ===
apiRouter.use("/quotations", upsellRouter);
// === M8 (Dev 2) ===
apiRouter.use("/quotations", billingRouter);
apiRouter.use("/invoices", invoiceRouter);
