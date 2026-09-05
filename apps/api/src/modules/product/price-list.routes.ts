// apps/api/src/modules/product/price-list.routes.ts
// === M1: PriceList routes ===
//
// Access control: reads open to any authenticated user; writes admin-only.
// requireRole("admin") is commented pending Dev 1's M0 completion of require-role.ts.

import { requireAuth } from "../../middleware/require-auth.js";
// import { requireRole } from "../../middleware/require-role.js"; // ← Dev 1 M0 pending
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import {
  createPriceListSchema,
  updatePriceListSchema,
  addPriceListItemSchema,
} from "./product.schema.js";
import * as c from "./price-list.controller.js";

export const priceListRouter = createRouter();

priceListRouter.use(requireAuth);

// ─── Price List CRUD ──────────────────────────────────────────────────────────
priceListRouter.get("/", c.listPriceListsController);
priceListRouter.get("/:id", c.getPriceListController);

priceListRouter.post(
  "/",
  /* requireRole("admin"), */
  validateRequest(createPriceListSchema),
  c.createPriceListController,
);
priceListRouter.patch(
  "/:id",
  /* requireRole("admin"), */
  validateRequest(updatePriceListSchema),
  c.updatePriceListController,
);
priceListRouter.delete(
  "/:id",
  /* requireRole("admin"), */
  c.deletePriceListController,
);

// ─── Price List Items sub-resource (/price-lists/:id/items) ──────────────────
priceListRouter.post(
  "/:id/items",
  /* requireRole("admin"), */
  validateRequest(addPriceListItemSchema),
  c.addPriceListItemController,
);
priceListRouter.delete(
  "/:id/items/:itemId",
  /* requireRole("admin"), */
  c.deletePriceListItemController,
);
