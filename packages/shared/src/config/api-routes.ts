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

  // === M1: Products ===
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
      description: "Create a product. (admin only)",
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
      description: "Update a product. (admin only)",
    },
    remove: {
      path: "/products/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a product. (admin only)",
    },
  },

  // === M1: Price Lists ===
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
      description: "Create a price list. (admin only)",
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
      description: "Update a price list. (admin only)",
    },
    remove: {
      path: "/price-lists/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a price list. (admin only)",
    },
    addItem: {
      path: "/price-lists/:id/items",
      method: "POST",
      auth: true,
      description: "Add an item to a price list. (admin only)",
    },
  },

  // === M2: Customers ===
  customers: {
    list: {
      path: "/customers",
      method: "GET",
      auth: true,
      description: "List all customers.",
    },
    create: {
      path: "/customers",
      method: "POST",
      auth: true,
      description: "Create a customer.",
    },
    getById: {
      path: "/customers/:id",
      method: "GET",
      auth: true,
      description: "Get customer by ID.",
    },
    update: {
      path: "/customers/:id",
      method: "PATCH",
      auth: true,
      description: "Update a customer.",
    },
    remove: {
      path: "/customers/:id",
      method: "DELETE",
      auth: true,
      description: "Delete a customer.",
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
      description: "Add a contact to a customer.",
    },
  },

  // === M6: Upsell & Cross-sell ===
  upsell: {
    list: {
      path: "/quotations/:id/upsell",
      method: "GET",
      auth: true,
      description: "Get ranked upsell suggestions for a quotation.",
    },
    add: {
      path: "/quotations/:id/upsell/:suggestedId",
      method: "POST",
      auth: true,
      description: "Accept a suggestion and add it to the quotation.",
    },
  },

  // === M8: Billing ===
  billing: {
    getSchedule: {
      path: "/quotations/:id/billing",
      method: "GET",
      auth: true,
      description: "Get billing schedule for a quotation.",
    },
    subscriptionChange: {
      path: "/quotations/:id/billing/subscription-change",
      method: "POST",
      auth: true,
      description:
        "Mid-cycle subscription upgrade/downgrade/cancel. (finance/admin only)",
    },
  },

  // === M8: Invoices ===
  invoices: {
    recordPayment: {
      path: "/invoices/:invoiceId/payments",
      method: "POST",
      auth: true,
      description: "Record a payment against an invoice. (finance/admin only)",
    },
  },
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
