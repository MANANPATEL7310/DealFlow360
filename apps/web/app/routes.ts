import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

// Route paths are kept in sync with `appRoutes` in @template/shared.
// appRoutes.home = "/", login = "/auth/login", dashboard = "/app", settings = "/app/settings"
export default [
  index("routes/home.tsx"),
  route("auth/login", "routes/login.tsx"),
  route("portal", "routes/portal.tsx"),
  route("invoices/:id/paid", "routes/invoice-paid.tsx"),
  route(
    "invoices/:id/checkout-simulation",
    "routes/invoice-checkout-simulation.tsx",
  ),
  layout("routes/app-layout.tsx", [
    route("app", "routes/dashboard.tsx"),
    route("app/quotations", "routes/quotations.tsx"),
    route("app/quotations/:id", "routes/quotation-builder.tsx"),
    route("app/products", "routes/products.tsx"),
    route("app/customers", "routes/customers.tsx"),
    route("app/governance", "routes/governance.tsx"),
    route("app/approvals", "routes/approvals.tsx"),
    route("app/approvals/:id", "routes/approval-detail.tsx"),
    route("app/quotations/:id/fulfillment", "routes/fulfillment.tsx"),
    route("app/fulfillment", "routes/fulfillment-index.tsx"),
    route("app/quotations/:id/billing", "routes/billing.tsx"),
    route("app/billing", "routes/billing-index.tsx"),
    route("app/deal-health", "routes/deal-health.tsx"),
    route("app/reports", "routes/reports.tsx"),
    route("app/settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
