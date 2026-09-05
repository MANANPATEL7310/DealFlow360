// apps/api/src/modules/product/product.routes.ts
// === M1: Product & Variant routes ===
//
// Access control:
//   GET  (list/get)   — any authenticated internal user (requireAuth only)
//   POST/PATCH/DELETE — admin only
//
// NOTE: requireRole("admin") is imported from middleware/require-role.ts
// which is part of Dev 1's M0 completion. Until that file is merged,
// admin-write protection is handled by requireAuth only (temporary).
// Once require-role.ts lands, uncomment the requireRole lines below.

import { requireAuth } from "../../middleware/require-auth.js";
// import { requireRole } from "../../middleware/require-role.js"; // ← Dev 1 M0 pending
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import {
  createProductSchema,
  updateProductSchema,
  createProductVariantSchema,
} from "./product.schema.js";
import * as c from "./product.controller.js";

export const productRouter = createRouter();

// All product routes require authentication
productRouter.use(requireAuth);

// ─── Product CRUD ─────────────────────────────────────────────────────────────
productRouter.get("/", c.listProductsController);
productRouter.get("/:id", c.getProductController);

// Writes — requireRole("admin") once Dev 1's middleware is available
productRouter.post(
  "/",
  /* requireRole("admin"), */
  validateRequest(createProductSchema),
  c.createProductController,
);
productRouter.patch(
  "/:id",
  /* requireRole("admin"), */
  validateRequest(updateProductSchema),
  c.updateProductController,
);
productRouter.delete(
  "/:id",
  /* requireRole("admin"), */
  c.deleteProductController,
);

// ─── Variant sub-resource (/products/:id/variants) ────────────────────────────
productRouter.get("/:id/variants", c.listVariantsController);
productRouter.post(
  "/:id/variants",
  /* requireRole("admin"), */
  validateRequest(createProductVariantSchema),
  c.createVariantController,
);
productRouter.delete(
  "/:id/variants/:variantId",
  /* requireRole("admin"), */
  c.deleteVariantController,
);
