// apps/api/src/modules/customer/customer.routes.ts
// === M2: Customer routes ===
//
// Access control:
//   All routes — any authenticated internal user (requireAuth)
//   DELETE     — optionally requireRole("sales_manager", "admin") in production
//
// NOTE: requireRole is imported from middleware/require-role.ts
// which is part of Dev 1's M0 completion. Once that file is merged,
// uncomment the requireRole line on the delete route.

import { createRouter } from "../../lib/create-router.js";
import { requireAuth } from "../../middleware/require-auth.js";
// import { requireRole } from "../../middleware/require-role.js"; // ← Dev 1 M0 pending
import { validateRequest } from "../../lib/validate-request.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  createContactSchema,
} from "./customer.schema.js";
import * as c from "./customer.controller.js";

export const customerRouter = createRouter();

// All customer routes require authentication
customerRouter.use(requireAuth);

// ─── Customer CRUD ────────────────────────────────────────────────────────────
customerRouter.get("/", c.listCustomersController);
customerRouter.get("/:id", c.getCustomerController);
customerRouter.post(
  "/",
  validateRequest(createCustomerSchema),
  c.createCustomerController,
);
customerRouter.patch(
  "/:id",
  validateRequest(updateCustomerSchema),
  c.updateCustomerController,
);

// Sensitive — optionally: requireRole("sales_manager", "admin")
customerRouter.delete(
  "/:id",
  /* requireRole("sales_manager", "admin"), */
  c.deleteCustomerController,
);

// ─── Nested contacts sub-resource (/customers/:id/contacts) ───────────────────
customerRouter.get("/:id/contacts", c.listContactsController);
customerRouter.post(
  "/:id/contacts",
  validateRequest(createContactSchema),
  c.addContactController,
);
