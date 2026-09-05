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

  // ─── Governance (M3) ──────────────────────────────────────────────────────
  governance: {
    discountTiers: {
      list: {
        path: "/governance/discount-tiers",
        method: "GET",
        auth: true,
        description: "List all discount tier ceilings.",
      },
      upsert: {
        path: "/governance/discount-tiers",
        method: "PUT",
        auth: true,
        description: "Upsert a discount tier ceiling.",
      },
    },
    categoryCeilings: {
      list: {
        path: "/governance/category-ceilings",
        method: "GET",
        auth: true,
        description: "List all category discount ceilings.",
      },
      upsert: {
        path: "/governance/category-ceilings",
        method: "PUT",
        auth: true,
        description: "Upsert a category discount ceiling.",
      },
    },
    approvalRules: {
      list: {
        path: "/governance/approval-rules",
        method: "GET",
        auth: true,
        description: "List all approval chain rules.",
      },
      create: {
        path: "/governance/approval-rules",
        method: "POST",
        auth: true,
        description: "Create an approval chain rule.",
      },
      update: {
        path: "/governance/approval-rules/:id",
        method: "PATCH",
        auth: true,
        description: "Update an approval chain rule.",
      },
      remove: {
        path: "/governance/approval-rules/:id",
        method: "DELETE",
        auth: true,
        description: "Delete an approval chain rule.",
      },
    },
  },

  // ─── Quotations (M5) ──────────────────────────────────────────────────────
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
    confirm: {
      path: "/quotations/:id/confirm",
      method: "POST",
      auth: true,
      description: "Confirm quotation and trigger risk evaluation.",
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

  // ─── Customer Portal (M9) ───────────────────────────────────────────────────
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

  // ─── Fulfillment (M7) ─────────────────────────────────────────────────────
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

  // ─── Deal Health (M10) ────────────────────────────────────────────────────
  dealHealth: {
    alerts: {
      path: "/deal-health/alerts",
      method: "GET",
      auth: true,
      description: "List deal health alerts.",
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

  // ─── Reports (M11) ───────────────────────────────────────────────────────
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
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
