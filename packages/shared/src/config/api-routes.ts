/**
 * API Routes Registry — Single Source of Truth
 *
 * This file is the central contract between the backend and frontend.
 *
 * ✅ BACKEND DEVELOPER: When you add a new endpoint, register it here FIRST.
 * ✅ FRONTEND DEVELOPER: Always import route paths from here. Never hardcode strings.
 *
 * Path Format: Full path as the frontend will call it (e.g. "/auth/login")
 * Method:      HTTP verb in uppercase (GET | POST | PUT | PATCH | DELETE)
 * Auth:        Whether the route requires a valid Bearer token
 */

export const apiRoutes = {
  // ─── Health ────────────────────────────────────────────────────────────────
  health: {
    check: {
      path: "/health",
      method: "GET",
      auth: false,
      description: "Returns server health status.",
    },
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login: {
      path: "/auth/login",
      method: "POST",
      auth: false,
      description: "Authenticate with email & password. Returns access token.",
    },
    register: {
      path: "/auth/register",
      method: "POST",
      auth: false,
      description: "Register new user account with assigned role.",
    },
    me: {
      path: "/auth/me",
      method: "GET",
      auth: true,
      description: "Get current authenticated user profile.",
    },
  },

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    summary: {
      path: "/dashboard/summary",
      method: "GET",
      auth: true,
      description: "Returns summary statistics for the authenticated user.",
    },
  },

  // ─── ADD NEW ROUTES BELOW THIS LINE ────────────────────────────────────────
  // Follow the same pattern: add here first, then implement on backend, then consume on frontend.
  products: {
    list: {
      path: "/products",
      method: "GET",
      auth: true,
      description: "List all products.",
    },
    create: {
      path: "/products",
      method: "POST",
      auth: true,
      description: "Create a product.",
    },
    getById: {
      path: "/products/:id",
      method: "GET",
      auth: true,
      description: "Get product by ID.",
    },
    update: {
      path: "/products/:id",
      method: "PATCH",
      auth: true,
      description: "Update a product.",
    },
    remove: {
      path: "/products/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a product.",
    },
  },

  // ─── Customers ──────────────────────────────────────────────────────────────
  customers: {
    list: {
      path: "/customers",
      method: "GET",
      auth: true,
      description: "List all customer accounts.",
    },
    create: {
      path: "/customers",
      method: "POST",
      auth: true,
      description: "Create a new customer account.",
    },
    getById: {
      path: "/customers/:id",
      method: "GET",
      auth: true,
      description: "Get customer account by ID.",
    },
    update: {
      path: "/customers/:id",
      method: "PATCH",
      auth: true,
      description: "Update customer account details.",
    },
    remove: {
      path: "/customers/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a customer account.",
    },
    contacts: {
      path: "/customers/:id/contacts",
      method: "GET",
      auth: true,
      description: "List contacts for a customer.",
    },
    addContact: {
      path: "/customers/:id/contacts",
      method: "POST",
      auth: true,
      description: "Add contact to a customer.",
    },
    magicLink: {
      path: "/customers/:id/magic-link",
      method: "POST",
      auth: true,
      description: "Generate customer portal magic link.",
    },
  },

  // ─── Quotations ─────────────────────────────────────────────────────────────
  quotations: {
    list: {
      path: "/quotations",
      method: "GET",
      auth: true,
      description: "List quotations with filtering.",
    },
    create: {
      path: "/quotations",
      method: "POST",
      auth: true,
      description: "Create a new quotation.",
    },
    getById: {
      path: "/quotations/:id",
      method: "GET",
      auth: true,
      description: "Get quotation by ID.",
    },
    update: {
      path: "/quotations/:id",
      method: "PATCH",
      auth: true,
      description: "Update quotation draft.",
    },
    addLine: {
      path: "/quotations/:id/lines",
      method: "POST",
      auth: true,
      description: "Add a line item to quotation.",
    },
    updateLine: {
      path: "/quotations/:id/lines/:lineId",
      method: "PATCH",
      auth: true,
      description: "Update a quotation line item.",
    },
    removeLine: {
      path: "/quotations/:id/lines/:lineId",
      method: "DELETE",
      auth: true,
      description: "Remove a quotation line item.",
    },
    confirm: {
      path: "/quotations/:id/confirm",
      method: "POST",
      auth: true,
      description: "Confirm quotation through risk engine.",
    },
    risk: {
      path: "/quotations/:id/risk",
      method: "GET",
      auth: true,
      description: "Evaluate live blended risk score and breakdown.",
    },
    send: {
      path: "/quotations/:id/send",
      method: "POST",
      auth: true,
      description: "Mint portal token and transition quote to SENT.",
    },
    negotiations: {
      path: "/quotations/:id/negotiations",
      method: "GET",
      auth: true,
      description: "List negotiation requests for a quotation.",
    },
    answerNegotiation: {
      path: "/quotations/:id/negotiations/:negId/answer",
      method: "POST",
      auth: true,
      description: "Sales rep answers or accepts a negotiation request.",
    },
  },

  // ─── Approvals & Reviews ───────────────────────────────────────────────────
  approvals: {
    inbox: {
      path: "/approvals",
      method: "GET",
      auth: true,
      description: "List pending quotations requiring reviewer action.",
    },
    decision: {
      path: "/quotations/:id/approvals/decision",
      method: "POST",
      auth: true,
      description: "Submit audited approval decision.",
    },
    steps: {
      path: "/quotations/:id/approvals",
      method: "GET",
      auth: true,
      description: "Get ordered approval steps.",
    },
  },

  // ─── Discount Governance ───────────────────────────────────────────────────
  governance: {
    discountTiers: {
      path: "/governance/discount-tiers",
      method: "GET",
      auth: true,
      description: "List or upsert discount tier ceilings.",
    },
    categoryCeilings: {
      path: "/governance/category-ceilings",
      method: "GET",
      auth: true,
      description: "List or upsert category discount ceilings.",
    },
    approvalRules: {
      path: "/governance/approval-rules",
      method: "GET",
      auth: true,
      description: "List or create approval chain rules.",
    },
    approvalRuleById: {
      path: "/governance/approval-rules/:id",
      method: "PATCH",
      auth: true,
      description: "Update or delete approval chain rule by ID.",
    },
  },

  // ─── Deal Health ───────────────────────────────────────────────────────────
  dealHealth: {
    summary: {
      path: "/deal-health/summary",
      method: "GET",
      auth: true,
      description: "Get deal health radar metrics and KPIs.",
    },
    alerts: {
      path: "/deal-health/alerts",
      method: "GET",
      auth: true,
      description: "List deal health anomaly alerts.",
    },
    detect: {
      path: "/deal-health/detect",
      method: "POST",
      auth: true,
      description: "Run deal health anomaly scan.",
    },
    acknowledge: {
      path: "/deal-health/alerts/:id/acknowledge",
      method: "POST",
      auth: true,
      description: "Acknowledge deal health alert.",
    },
    resolve: {
      path: "/deal-health/alerts/:id/resolve",
      method: "POST",
      auth: true,
      description: "Resolve deal health alert with audit note.",
    },
  },

  // ─── Upsell & Recommendations ───────────────────────────────────────────────
  upsell: {
    list: {
      path: "/quotations/:id/upsell",
      method: "GET",
      auth: true,
      description: "Get ranked upsell recommendations with margin-delta.",
    },
    add: {
      path: "/quotations/:id/upsell/:suggestedId",
      method: "POST",
      auth: true,
      description: "Add recommended upsell item to quotation.",
    },
  },

  // ─── Warehouse Fulfillment ──────────────────────────────────────────────────
  fulfillment: {
    get: {
      path: "/quotations/:id/fulfillment",
      method: "GET",
      auth: true,
      description: "Get quotation fulfillment plan.",
    },
    accept: {
      path: "/quotations/:id/fulfillment/accept",
      method: "POST",
      auth: true,
      description: "Accept suggestion and commit stock.",
    },
    override: {
      path: "/quotations/:id/fulfillment/override",
      method: "POST",
      auth: true,
      description: "Save manual split overrides.",
    },
    consolidate: {
      path: "/quotations/:id/fulfillment/consolidate",
      method: "POST",
      auth: true,
      description: "Consolidate remaining backorder.",
    },
  },
  warehouses: {
    list: {
      path: "/warehouses",
      method: "GET",
      auth: true,
      description: "List all regional warehouses.",
    },
  },

  // ─── Hybrid Billing ────────────────────────────────────────────────────────
  billing: {
    schedule: {
      path: "/quotations/:id/billing",
      method: "GET",
      auth: true,
      description: "Get billing schedule for a quotation.",
    },
    change: {
      path: "/quotations/:id/billing/change",
      method: "POST",
      auth: true,
      description: "Modify or cancel a subscription line with proration.",
    },
  },
  invoices: {
    pay: {
      path: "/invoices/:id/pay",
      method: "POST",
      auth: true,
      description: "Record payment against an invoice.",
    },
  },

  // ─── Customer Portal (External Scoped Access) ──────────────────────────────
  portal: {
    quotation: {
      path: "/portal/quotation",
      method: "GET",
      auth: false,
      description: "Get scoped quotation view (sanitized, costs stripped).",
    },
    open: {
      path: "/portal/open",
      method: "POST",
      auth: false,
      description:
        "Acknowledge quotation opened by customer (SENT -> UNDER_NEGOTIATION).",
    },
    negotiations: {
      path: "/portal/negotiations",
      method: "POST",
      auth: false,
      description: "Customer submits counter-offer or discussion request.",
    },
    confirm: {
      path: "/portal/confirm",
      method: "POST",
      auth: false,
      description: "Customer confirms proposal through auto-governance gate.",
    },
  },

  // ─── Executive Reporting & Analytics (PS A7) ────────────────────────────────
  reports: {
    sales: {
      path: "/reports/sales",
      method: "GET",
      auth: true,
      description: "Returns aggregated sales report dataset.",
    },
    exportXlsx: {
      path: "/reports/sales/export.xlsx",
      method: "GET",
      auth: true,
      description: "Stream sales report in XLSX format.",
    },
    exportPdf: {
      path: "/reports/sales/export.pdf",
      method: "GET",
      auth: true,
      description: "Stream sales report in PDF format.",
    },
  },
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
