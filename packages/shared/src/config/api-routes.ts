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
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
