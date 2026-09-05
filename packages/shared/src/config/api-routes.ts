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
    list:    { path: "/products",     method: "GET",    auth: true,  description: "List all products." },
    create:  { path: "/products",     method: "POST",   auth: true,  description: "Create a product." },
    getById: { path: "/products/:id", method: "GET",    auth: true,  description: "Get product by ID." },
    update:  { path: "/products/:id", method: "PATCH",  auth: true,  description: "Update a product." },
    remove:  { path: "/products/:id", method: "DELETE", auth: true,  description: "Delete a product." },
  },
  
  // ─── Customers ──────────────────────────────────────────────────────────────
  customers: {
    list:       { path: "/customers",              method: "GET",    auth: true, description: "List all customer accounts." },
    create:     { path: "/customers",              method: "POST",   auth: true, description: "Create a new customer account." },
    getById:    { path: "/customers/:id",          method: "GET",    auth: true, description: "Get customer account by ID." },
    update:     { path: "/customers/:id",          method: "PATCH",  auth: true, description: "Update customer account details." },
    remove:     { path: "/customers/:id",          method: "DELETE", auth: true, description: "Delete a customer account." },
    contacts:   { path: "/customers/:id/contacts", method: "GET",    auth: true, description: "List contacts for a customer." },
    addContact: { path: "/customers/:id/contacts", method: "POST",   auth: true, description: "Add contact to a customer." },
    magicLink:  { path: "/customers/:id/magic-link", method: "POST", auth: true, description: "Generate customer portal magic link." },
  },

  // ─── Quotations ─────────────────────────────────────────────────────────────
  quotations: {
    list:        { path: "/quotations",                    method: "GET",    auth: true,  description: "List quotations with filtering." },
    create:      { path: "/quotations",                    method: "POST",   auth: true,  description: "Create a new quotation." },
    getById:     { path: "/quotations/:id",                method: "GET",    auth: true,  description: "Get quotation by ID." },
    update:      { path: "/quotations/:id",                method: "PATCH",  auth: true,  description: "Update quotation draft." },
    addLine:     { path: "/quotations/:id/lines",          method: "POST",   auth: true,  description: "Add a line item to quotation." },
    updateLine:  { path: "/quotations/:id/lines/:lineId",  method: "PATCH",  auth: true,  description: "Update a quotation line item." },
    removeLine:  { path: "/quotations/:id/lines/:lineId",  method: "DELETE", auth: true,  description: "Remove a quotation line item." },
    confirm:     { path: "/quotations/:id/confirm",        method: "POST",   auth: true,  description: "Confirm quotation through risk engine." },
    risk:        { path: "/quotations/:id/risk",           method: "GET",    auth: true,  description: "Evaluate live blended risk score and breakdown." },
  },

  // ─── Approvals & Reviews ───────────────────────────────────────────────────
  approvals: {
    inbox:       { path: "/approvals",                               method: "GET",    auth: true, description: "List pending quotations requiring reviewer action." },
    decision:    { path: "/quotations/:id/approvals/decision",       method: "POST",   auth: true, description: "Submit audited approval decision." },
    steps:       { path: "/quotations/:id/approvals",                method: "GET",    auth: true, description: "Get ordered approval steps." },
  },

  // ─── Discount Governance ───────────────────────────────────────────────────
  governance: {
    discountTiers:    { path: "/governance/discount-tiers",        method: "GET",   auth: true, description: "List or upsert discount tier ceilings." },
    categoryCeilings: { path: "/governance/category-ceilings",     method: "GET",   auth: true, description: "List or upsert category discount ceilings." },
    approvalRules:    { path: "/governance/approval-rules",        method: "GET",   auth: true, description: "List or create approval chain rules." },
    approvalRuleById: { path: "/governance/approval-rules/:id",    method: "PATCH", auth: true, description: "Update or delete approval chain rule by ID." },
  },

  // ─── Deal Health ───────────────────────────────────────────────────────────
  dealHealth: {
    alerts:      { path: "/deal-health/alerts",    method: "GET",    auth: true,  description: "List deal health anomaly alerts." },
    detect:      { path: "/deal-health/detect",    method: "POST",   auth: true,  description: "Run deal health anomaly scan." },
    acknowledge: { path: "/deal-health/alerts/:id/acknowledge", method: "POST", auth: true, description: "Acknowledge deal health alert." },
  },

  // ─── Upsell & Recommendations ───────────────────────────────────────────────
  upsell: {
    list: { path: "/quotations/:id/upsell", method: "GET", auth: true, description: "Get ranked upsell recommendations with margin-delta." },
    add:  { path: "/quotations/:id/upsell/:suggestedId", method: "POST", auth: true, description: "Add recommended upsell item to quotation." },
  },
} as const;

// ─── Derived Types (auto-generated, do not edit manually) ─────────────────────
export type ApiRoutes = typeof apiRoutes;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
