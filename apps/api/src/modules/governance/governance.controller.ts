// apps/api/src/modules/governance/governance.controller.ts
import type { Request, Response } from "express";
import { sendCreated, sendOk } from "../../lib/response.js";
import {
  approvalRuleService,
  categoryCeilingService,
  discountTierService,
} from "./governance.service.js";

// ── Discount Tiers ────────────────────────────────────────────────────────────
export async function listDiscountTiersController(
  _req: Request,
  res: Response,
) {
  const tiers = await discountTierService.list();
  return sendOk(res, tiers);
}

export async function upsertDiscountTierController(
  req: Request,
  res: Response,
) {
  const tier = await discountTierService.upsert(req.body, req.user?.sub);
  return sendOk(res, tier, "Tier ceiling saved.");
}

// ── Category Ceilings ─────────────────────────────────────────────────────────
export async function listCategoryCeilingsController(
  _req: Request,
  res: Response,
) {
  const ceilings = await categoryCeilingService.list();
  return sendOk(res, ceilings);
}

export async function upsertCategoryCeilingController(
  req: Request,
  res: Response,
) {
  const ceiling = await categoryCeilingService.upsert(req.body, req.user?.sub);
  return sendOk(res, ceiling, "Category ceiling saved.");
}

// ── Approval Chain Rules ──────────────────────────────────────────────────────
export async function listApprovalRulesController(
  _req: Request,
  res: Response,
) {
  const rules = await approvalRuleService.list();
  return sendOk(res, rules);
}

export async function createApprovalRuleController(
  req: Request,
  res: Response,
) {
  const rule = await approvalRuleService.create(req.body, req.user?.sub);
  return sendCreated(res, rule, "Approval rule created.");
}

export async function updateApprovalRuleController(
  req: Request,
  res: Response,
) {
  const rule = await approvalRuleService.update(
    req.params.id as string,
    req.body,
    req.user?.sub,
  );
  return sendOk(res, rule, "Approval rule updated.");
}

export async function deleteApprovalRuleController(
  req: Request,
  res: Response,
) {
  await approvalRuleService.delete(req.params.id as string, req.user?.sub);
  return sendOk(res, { id: req.params.id }, "Approval rule deleted.");
}
