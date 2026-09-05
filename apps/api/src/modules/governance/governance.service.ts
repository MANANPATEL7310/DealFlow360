// apps/api/src/modules/governance/governance.service.ts
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import type {
  CreateApprovalRuleInput,
  CustomerTier,
  ProductCategory,
  UpdateApprovalRuleInput,
} from "./governance.schema.js";

// ── Discount Tier Service (upsert-by-key) ─────────────────────────────────────
export const discountTierService = {
  list: () =>
    db.discountTier.findMany({
      orderBy: { maxDiscountPct: "asc" },
    }),

  upsert: async (
    input: { customerTier: CustomerTier; maxDiscountPct: number },
    actorId?: string,
  ) => {
    const tier = await db.discountTier.upsert({
      where: { customerTier: input.customerTier },
      update: { maxDiscountPct: input.maxDiscountPct },
      create: {
        customerTier: input.customerTier,
        maxDiscountPct: input.maxDiscountPct,
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "UPSERT_DISCOUNT_TIER",
      entity: "DiscountTier",
      entityId: tier.id,
      diff: {
        customerTier: input.customerTier,
        maxDiscountPct: input.maxDiscountPct,
      },
    });

    return tier;
  },
};

// ── Category Ceiling Service (upsert-by-key) ──────────────────────────────────
export const categoryCeilingService = {
  list: () =>
    db.categoryCeiling.findMany({
      orderBy: { maxDiscountPct: "asc" },
    }),

  upsert: async (
    input: { category: ProductCategory; maxDiscountPct: number },
    actorId?: string,
  ) => {
    const ceiling = await db.categoryCeiling.upsert({
      where: { category: input.category },
      update: { maxDiscountPct: input.maxDiscountPct },
      create: {
        category: input.category,
        maxDiscountPct: input.maxDiscountPct,
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "UPSERT_CATEGORY_CEILING",
      entity: "CategoryCeiling",
      entityId: ceiling.id,
      diff: { category: input.category, maxDiscountPct: input.maxDiscountPct },
    });

    return ceiling;
  },
};

// ── Approval Chain Rule Service (CRUD) ────────────────────────────────────────
export const approvalRuleService = {
  list: () =>
    db.approvalChainRule.findMany({
      orderBy: { minScore: "asc" },
    }),

  getById: (id: string) =>
    db.approvalChainRule.findUnique({
      where: { id },
    }),

  create: async (data: CreateApprovalRuleInput, actorId?: string) => {
    const rule = await db.approvalChainRule.create({
      data: {
        name: data.name,
        minScore: data.minScore,
        maxScore: data.maxScore ?? null,
        requiredLevels: data.requiredLevels,
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "CREATE_APPROVAL_RULE",
      entity: "ApprovalChainRule",
      entityId: rule.id,
      diff: data,
    });

    return rule;
  },

  update: async (
    id: string,
    data: UpdateApprovalRuleInput,
    actorId?: string,
  ) => {
    const rule = await db.approvalChainRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.minScore !== undefined && { minScore: data.minScore }),
        ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
        ...(data.requiredLevels !== undefined && {
          requiredLevels: data.requiredLevels,
        }),
      },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "UPDATE_APPROVAL_RULE",
      entity: "ApprovalChainRule",
      entityId: rule.id,
      diff: data,
    });

    return rule;
  },

  delete: async (id: string, actorId?: string) => {
    const rule = await db.approvalChainRule.delete({
      where: { id },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "DELETE_APPROVAL_RULE",
      entity: "ApprovalChainRule",
      entityId: id,
      diff: rule,
    });

    return rule;
  },
};

// Helper for M4 (Risk Engine) to load rules ordered by minScore
export function loadApprovalRules() {
  return db.approvalChainRule.findMany({
    orderBy: { minScore: "asc" },
  });
}

export async function loadDiscountPolicy(tier?: string) {
  const [tierCeilings, categoryCeilings, approvalRules] = await Promise.all([
    discountTierService.list(),
    categoryCeilingService.list(),
    approvalRuleService.list(),
  ]);
  const activeTier = tier
    ? tierCeilings.find((t) => t.customerTier === tier)
    : undefined;
  return {
    tier,
    tierCeilingPct: activeTier?.maxDiscountPct ?? null,
    allTierCeilings: tierCeilings,
    categoryCeilings,
    approvalRules,
  };
}
