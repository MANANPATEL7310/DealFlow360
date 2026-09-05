// apps/api/src/modules/governance/governance.routes.ts
import { createRouter } from "../../lib/create-router.js";
import { validateRequest } from "../../lib/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireRole } from "../../middleware/require-role.js";
import {
  createApprovalRuleController,
  deleteApprovalRuleController,
  listApprovalRulesController,
  listCategoryCeilingsController,
  listDiscountTiersController,
  updateApprovalRuleController,
  upsertCategoryCeilingController,
  upsertDiscountTierController,
} from "./governance.controller.js";
import {
  createApprovalRuleSchema,
  updateApprovalRuleSchema,
  upsertCategoryCeilingSchema,
  upsertDiscountTierSchema,
} from "./governance.schema.js";

export const governanceRouter = createRouter();

// Admin-only module
governanceRouter.use(requireAuth, requireRole("admin"));

// ── Discount Tier Ceilings ────────────────────────────────────────────────────
governanceRouter.get("/discount-tiers", listDiscountTiersController);
governanceRouter.put(
  "/discount-tiers",
  validateRequest(upsertDiscountTierSchema),
  upsertDiscountTierController,
);

// ── Category Discount Ceilings ────────────────────────────────────────────────
governanceRouter.get("/category-ceilings", listCategoryCeilingsController);
governanceRouter.put(
  "/category-ceilings",
  validateRequest(upsertCategoryCeilingSchema),
  upsertCategoryCeilingController,
);

// ── Approval Chain Rules ──────────────────────────────────────────────────────
governanceRouter.get("/approval-rules", listApprovalRulesController);
governanceRouter.post(
  "/approval-rules",
  validateRequest(createApprovalRuleSchema),
  createApprovalRuleController,
);
governanceRouter.patch(
  "/approval-rules/:id",
  validateRequest(updateApprovalRuleSchema),
  updateApprovalRuleController,
);
governanceRouter.delete("/approval-rules/:id", deleteApprovalRuleController);
