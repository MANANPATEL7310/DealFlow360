import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes.js";
import { dealHealthRouter } from "../modules/deal-health/deal-health.routes.js";
import { fulfillmentRouter } from "../modules/fulfillment/fulfillment.routes.js";
import { governanceRouter } from "../modules/governance/governance.routes.js";
import { healthRouter } from "../modules/health/health.routes.js";
// === M1: Products & Price Lists (Dev 2) ===
import { productRouter } from "../modules/product/product.routes.js";
import { priceListRouter } from "../modules/product/price-list.routes.js";
// === M2: Customers (Dev 2) ===
import { customerRouter } from "../modules/customer/customer.routes.js";
// === M5: Quotations (Dev 1) ===
import { quotationRouter } from "../modules/quotation/quotation.routes.js";
import { portalRouter } from "../modules/portal/portal.routes.js";
// === M6: Upsell & Cross-sell (Dev 2) ===
import { upsellRouter } from "../modules/upsell/upsell.routes.js";
// === M8: Hybrid Billing & Invoicing (Dev 2) ===
import {
  billingRouter,
  invoiceRouter,
} from "../modules/billing/billing.routes.js";
import { reportsRouter } from "../modules/reports/reports.routes.js";
import { aiFulfillmentRouter } from "../modules/ai/fulfillment/routes.js";
import { aiDealHealthRouter } from "../modules/ai/deal-health/routes.js";
import { aiInsightsRouter } from "../modules/ai/insights/routes.js";
import { aiApprovalsRouter } from "../modules/ai/approvals/approvals.routes.js";
import { discountApprovalRouter } from "../modules/ai/discount-approval/routes.js";
import { negotiationRouter } from "../modules/ai/negotiation/routes.js";
import { aiRecommendationsRouter } from "../modules/ai/recommendations/routes.js";
import { aiBillingRouter } from "../modules/ai/billing/routes.js";
import { paymentGatewayRouter } from "../modules/payment-gateway/payment-gateway.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/deal-health", dealHealthRouter);
// === M1 ===
apiRouter.use("/products", productRouter);
apiRouter.use("/price-lists", priceListRouter);
// === M2 ===
apiRouter.use("/customers", customerRouter);
// === M3 (Dev 1) ===
apiRouter.use("/governance", governanceRouter);
// === M5 (Dev 1) ===
apiRouter.use("/quotations", quotationRouter);
apiRouter.use("/quotations", fulfillmentRouter);
// === M6 (Dev 2) — second router on /quotations for upsell sub-routes ===
apiRouter.use("/quotations", upsellRouter);
// === M8 (Dev 2) ===
apiRouter.use("/quotations", billingRouter);
apiRouter.use("/invoices", invoiceRouter);
apiRouter.use("/portal", portalRouter);
apiRouter.use("/reports", reportsRouter);
// === Payment Gateway ===
apiRouter.use("/payments", paymentGatewayRouter);
// === Phase 2: Agentic AI ===
apiRouter.use("/ai", aiApprovalsRouter);
apiRouter.use("/ai", discountApprovalRouter);
apiRouter.use("/ai", negotiationRouter);
apiRouter.use("/ai", aiFulfillmentRouter);
apiRouter.use("/ai", aiDealHealthRouter);
apiRouter.use("/ai", aiInsightsRouter);
apiRouter.use("/ai", aiRecommendationsRouter);
apiRouter.use("/ai", aiBillingRouter);
