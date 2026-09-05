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
    register: {
      path: "/auth/register",
      method: "POST",
      auth: false,
      description: "Register a new user. Returns access token.",
    },
    login: {
      path: "/auth/login",
      method: "POST",
      auth: false,
      description: "Authenticate with email & password. Returns access token.",
    },
    me: {
      path: "/auth/me",
      method: "GET",
      auth: true,
      description: "Returns the currently authenticated user.",
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

  // ─── Products & Price Lists ────────────────────────────────────────────────
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

  priceLists: {
    list: {
      path: "/price-lists",
      method: "GET",
      auth: true,
      description: "List all price lists.",
    },
    create: {
      path: "/price-lists",
      method: "POST",
      auth: true,
      description: "Create a price list.",
    },
    getById: {
      path: "/price-lists/:id",
      method: "GET",
      auth: true,
      description: "Get price list by ID.",
    },
    update: {
      path: "/price-lists/:id",
      method: "PATCH",
      auth: true,
      description: "Update a price list.",
    },
    remove: {
      path: "/price-lists/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a price list.",
    },
    addItem: {
      path: "/price-lists/:id/items",
      method: "POST",
      auth: true,
      description: "Add or override item in price list.",
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

  // ─── Governance ────────────────────────────────────────────────────────────
  governance: {
    discountTiers: {
      path: "/governance/discount-tiers",
      method: "GET",
      auth: true,
      description: "List or upsert discount tier ceilings.",
    },
    upsertDiscountTier: {
      path: "/governance/discount-tiers",
      method: "POST",
      auth: true,
      description: "Upsert discount tier ceiling.",
    },
    categoryCeilings: {
      path: "/governance/category-ceilings",
      method: "GET",
      auth: true,
      description: "List or upsert category discount ceilings.",
    },
    upsertCategoryCeiling: {
      path: "/governance/category-ceilings",
      method: "POST",
      auth: true,
      description: "Upsert category discount ceiling.",
    },
    approvalRules: {
      path: "/governance/approval-rules",
      method: "GET",
      auth: true,
      description: "List approval chain rules.",
    },
    createApprovalRule: {
      path: "/governance/approval-rules",
      method: "POST",
      auth: true,
      description: "Create approval chain rule.",
    },
    updateApprovalRule: {
      path: "/governance/approval-rules/:id",
      method: "PATCH",
      auth: true,
      description: "Update approval chain rule by ID.",
    },
    approvalRuleById: {
      path: "/governance/approval-rules/:id",
      method: "PATCH",
      auth: true,
      description: "Update or delete approval chain rule by ID.",
    },
    removeApprovalRule: {
      path: "/governance/approval-rules/:id",
      method: "DELETE",
      auth: true,
      description: "Delete an approval chain rule.",
    },
  },

  // ─── Quotations ────────────────────────────────────────────────────────────
  quotations: {
    list: {
      path: "/quotations",
      method: "GET",
      auth: true,
      description: "List quotations.",
    },
    getById: {
      path: "/quotations/:id",
      method: "GET",
      auth: true,
      description: "Get quotation by ID.",
    },
    create: {
      path: "/quotations",
      method: "POST",
      auth: true,
      description: "Create a new quotation.",
    },
    update: {
      path: "/quotations/:id",
      method: "PATCH",
      auth: true,
      description: "Update quotation header or metadata.",
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
      description: "Update a line item on quotation.",
    },
    removeLine: {
      path: "/quotations/:id/lines/:lineId",
      method: "DELETE",
      auth: true,
      description: "Delete a line item from quotation.",
    },
    overrideDiscount: {
      path: "/quotations/:id/override-discount",
      method: "POST",
      auth: true,
      description: "Apply bulk order-level discount override.",
    },
    confirm: {
      path: "/quotations/:id/confirm",
      method: "POST",
      auth: true,
      description: "Confirm quotation and trigger risk evaluation.",
    },
    risk: {
      path: "/quotations/:id/risk",
      method: "GET",
      auth: true,
      description: "Evaluate live blended risk score and breakdown.",
    },
    approvalDecision: {
      path: "/quotations/:id/approvals/decision",
      method: "POST",
      auth: true,
      description: "Submit approval decision (approve, reject, return).",
    },
    send: {
      path: "/quotations/:id/send",
      method: "POST",
      auth: true,
      description:
        "Send approved quotation to customer and mint portal access token.",
    },
    negotiations: {
      path: "/quotations/:id/negotiations",
      method: "GET",
      auth: true,
      description: "List negotiation requests raised for this quotation.",
    },
    answerNegotiation: {
      path: "/quotations/:id/negotiations/:negId/answer",
      method: "POST",
      auth: true,
      description: "Answer or accept a customer negotiation request.",
    },
  },

  // ─── Approvals & Reviews ───────────────────────────────────────────────────
  approvals: {
    list: {
      path: "/approvals",
      method: "GET",
      auth: true,
      description: "List pending quotations requiring reviewer action.",
    },
    inbox: {
      path: "/approvals",
      method: "GET",
      auth: true,
      description: "List pending quotations requiring reviewer action.",
    },
    decide: {
      path: "/quotations/:id/approvals/decision",
      method: "POST",
      auth: true,
      description: "Submit audited approval decision.",
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

  // ─── Fulfillment ───────────────────────────────────────────────────────────
  fulfillment: {
    get: {
      path: "/quotations/:id/fulfillment",
      method: "GET",
      auth: true,
      description: "Get fulfillment plan for a quotation.",
    },
    moveToFulfillment: {
      path: "/quotations/:id/fulfillment",
      method: "POST",
      auth: true,
      description:
        "Move a confirmed quotation into fulfillment and generate a plan.",
    },
    accept: {
      path: "/quotations/:id/fulfillment/accept",
      method: "POST",
      auth: true,
      description: "Accept the suggested fulfillment plan and commit stock.",
    },
    override: {
      path: "/quotations/:id/fulfillment/override",
      method: "POST",
      auth: true,
      description: "Override the fulfillment plan with manual splits.",
    },
    consolidate: {
      path: "/quotations/:id/backorders/:backorderId/consolidate",
      method: "POST",
      auth: true,
      description:
        "Consolidate an outstanding backorder against current stock.",
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
      description: "Run deal health detection.",
    },
    acknowledge: {
      path: "/deal-health/alerts/:id/acknowledge",
      method: "POST",
      auth: true,
      description: "Acknowledge a deal health alert.",
    },
    resolve: {
      path: "/deal-health/alerts/:id/resolve",
      method: "POST",
      auth: true,
      description: "Resolve a deal health alert.",
    },
    nudge: {
      path: "/deal-health/alerts/:id/nudge",
      method: "POST",
      auth: true,
      description: "Nudge or escalate a deal health alert.",
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
      description: "Accept a suggestion and add it to the quotation.",
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
    getSchedule: {
      path: "/quotations/:id/billing",
      method: "GET",
      auth: true,
      description: "Get billing schedule for a quotation.",
    },
    change: {
      path: "/quotations/:id/billing/subscription-change",
      method: "POST",
      auth: true,
      description: "Modify or cancel a subscription line with proration.",
    },
    subscriptionChange: {
      path: "/quotations/:id/billing/subscription-change",
      method: "POST",
      auth: true,
      description:
        "Mid-cycle subscription upgrade/downgrade/cancel. (finance/admin only)",
    },
  },

  // ─── Invoices ──────────────────────────────────────────────────────────────
  invoices: {
    pay: {
      path: "/invoices/:invoiceId/payments",
      method: "POST",
      auth: true,
      description: "Record payment against an invoice.",
    },
    recordPayment: {
      path: "/invoices/:invoiceId/payments",
      method: "POST",
      auth: true,
      description: "Record a payment against an invoice. (finance/admin only)",
    },
  },

  // ─── Customer Portal (External Scoped Access) ──────────────────────────────
  portal: {
    quotation: {
      path: "/portal/quotation",
      method: "GET",
      auth: false,
      description:
        "Customer view of the quotation (safe projection, cost & margin stripped).",
    },
    open: {
      path: "/portal/open",
      method: "POST",
      auth: false,
      description:
        "Mark quotation as UNDER_NEGOTIATION when opened by customer.",
    },
    negotiations: {
      path: "/portal/negotiations",
      method: "POST",
      auth: false,
      description:
        "Customer submits a comment or counter-discount negotiation request.",
    },
    confirm: {
      path: "/portal/confirm",
      method: "POST",
      auth: false,
      description:
        "Customer confirms quote — folds accepted counters and re-evaluates risk governance gate.",
    },
  },

  // ─── Executive Reporting & Analytics ───────────────────────────────────────
  reports: {
    sales: {
      path: "/reports/sales",
      method: "GET",
      auth: true,
      description: "Returns scoped sales reporting metrics and funnel data.",
    },
    exportXlsx: {
      path: "/reports/sales/export.xlsx",
      method: "GET",
      auth: true,
      description: "Exports the scoped sales report as XLSX.",
    },
    exportPdf: {
      path: "/reports/sales/export.pdf",
      method: "GET",
      auth: true,
      description: "Exports the scoped sales report as PDF.",
    },
  },

  // ─── Compliance Audit Trail & System Configuration ─────────────────────────
  admin: {
    settings: {
      path: "/admin/settings",
      method: "GET",
      auth: true,
      description: "List runtime system settings.",
    },
    updateSetting: {
      path: "/admin/settings/:key",
      method: "PUT",
      auth: true,
      description: "Update one runtime system setting.",
    },
    auditLogs: {
      path: "/admin/audit-logs",
      method: "GET",
      auth: true,
      description: "List filtered audit log entries.",
    },
    aiUsage: {
      path: "/admin/ai-usage",
      method: "GET",
      auth: true,
      description: "Summarize AI spend, latency, failures, and HITL pauses.",
    },
  },

  // ─── Agentic AI (Phase 2) ────────────────────────────────────────────────
  aiApprovals: {
    list: {
      path: "/ai/approvals",
      method: "GET",
      auth: true,
      description: "List human-in-the-loop AI approval requests.",
    },
    decision: {
      path: "/ai/approvals/:id/decision",
      method: "POST",
      auth: true,
      description: "Approve or reject an AI proposed action.",
    },
  },

  aiDiscountApproval: {
    review: {
      path: "/ai/discount-approval/:quotationId",
      method: "POST",
      auth: true,
      description: "Get AI advisory review for a flagged quotation.",
    },
  },

  aiRecommendations: {
    list: {
      path: "/ai/recommendations/:quotationId",
      method: "POST",
      auth: true,
      description: "Get AI-ranked explanations for M6 upsell candidates.",
    },
  },

  aiFulfillment: {
    plan: {
      path: "/ai/fulfillment/:quotationId",
      method: "POST",
      auth: true,
      description: "Ask AI to propose or explain a fulfillment split.",
    },
  },

  aiBilling: {
    explain: {
      path: "/ai/billing/:quotationId/explain",
      method: "POST",
      auth: true,
      description: "Explain hybrid billing and optionally draft a credit note.",
    },
  },

  aiDealHealth: {
    triage: {
      path: "/ai/deal-health/triage",
      method: "POST",
      auth: true,
      description: "Triage deterministic M10 deal-health alerts with AI.",
    },
  },

  aiNegotiation: {
    assist: {
      path: "/ai/negotiation/:requestId",
      method: "POST",
      auth: true,
      description: "Draft an internal response to a customer negotiation.",
    },
  },

  aiInsights: {
    query: {
      path: "/ai/insights/query",
      method: "POST",
      auth: true,
      description:
        "Translate natural language into whitelisted M11 report filters.",
    },
  },
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
