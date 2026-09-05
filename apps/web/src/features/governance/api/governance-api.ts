import {
  apiRoutes,
  type ApprovalChainRule,
  type CategoryDiscountCeiling,
  type CreateApprovalRuleInput,
  type CustomerTier,
  type DiscountSimulationInput,
  type DiscountSimulationResult,
  type DiscountTierCeiling,
  type ProductCategory,
  SEED_APPROVAL_RULES,
  SEED_CATEGORY_CEILINGS,
  SEED_DISCOUNT_TIERS,
  type UpdateApprovalRuleInput,
  type UpsertCategoryCeilingInput,
  type UpsertDiscountTierInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

// In-memory mock storage for standalone dev/eval
const localTiers: DiscountTierCeiling[] = [...SEED_DISCOUNT_TIERS];
const localCeilings: CategoryDiscountCeiling[] = [...SEED_CATEGORY_CEILINGS];
let localRules: ApprovalChainRule[] = [...SEED_APPROVAL_RULES];

export const governanceApi = {
  // ─── Discount Tiers ────────────────────────────────────────────────────────
  async getDiscountTiers(): Promise<DiscountTierCeiling[]> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.governance.discountTiers.path,
      );
      return data.data;
    } catch {
      return [...localTiers].sort(
        (a, b) => a.maxDiscountPct - b.maxDiscountPct,
      );
    }
  },

  async upsertDiscountTier(
    input: UpsertDiscountTierInput,
  ): Promise<DiscountTierCeiling> {
    try {
      const { data } = await apiClient.put(
        apiRoutes.governance.discountTiers.path,
        input,
      );
      return data.data;
    } catch {
      const existingIndex = localTiers.findIndex(
        (t) => t.customerTier === input.customerTier,
      );
      const existing =
        existingIndex >= 0 ? localTiers[existingIndex] : undefined;
      const updated: DiscountTierCeiling = {
        id: existing ? existing.id : `dt-${input.customerTier.toLowerCase()}`,
        customerTier: input.customerTier,
        maxDiscountPct: input.maxDiscountPct,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        localTiers[existingIndex] = updated;
      } else {
        localTiers.push(updated);
      }
      return updated;
    }
  },

  // ─── Category Ceilings ─────────────────────────────────────────────────────
  async getCategoryCeilings(): Promise<CategoryDiscountCeiling[]> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.governance.categoryCeilings.path,
      );
      return data.data;
    } catch {
      return [...localCeilings].sort(
        (a, b) => a.maxDiscountPct - b.maxDiscountPct,
      );
    }
  },

  async upsertCategoryCeiling(
    input: UpsertCategoryCeilingInput,
  ): Promise<CategoryDiscountCeiling> {
    try {
      const { data } = await apiClient.put(
        apiRoutes.governance.categoryCeilings.path,
        input,
      );
      return data.data;
    } catch {
      const existingIndex = localCeilings.findIndex(
        (c) => c.category === input.category,
      );
      const existing =
        existingIndex >= 0 ? localCeilings[existingIndex] : undefined;
      const updated: CategoryDiscountCeiling = {
        id: existing ? existing.id : `cc-${input.category.toLowerCase()}`,
        category: input.category,
        maxDiscountPct: input.maxDiscountPct,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        localCeilings[existingIndex] = updated;
      } else {
        localCeilings.push(updated);
      }
      return updated;
    }
  },

  // ─── Approval Rules ────────────────────────────────────────────────────────
  async getApprovalRules(): Promise<ApprovalChainRule[]> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.governance.approvalRules.path,
      );
      return data.data;
    } catch {
      return [...localRules].sort((a, b) => a.minScore - b.minScore);
    }
  },

  async createApprovalRule(
    input: CreateApprovalRuleInput,
  ): Promise<ApprovalChainRule> {
    try {
      const { data } = await apiClient.post(
        apiRoutes.governance.approvalRules.path,
        input,
      );
      return data.data;
    } catch {
      const newRule: ApprovalChainRule = {
        id: `acr-${Date.now()}`,
        name: input.name,
        minScore: input.minScore,
        maxScore: input.maxScore ?? null,
        requiredLevels: input.requiredLevels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localRules.push(newRule);
      return newRule;
    }
  },

  async updateApprovalRule(
    id: string,
    input: UpdateApprovalRuleInput,
  ): Promise<ApprovalChainRule> {
    try {
      const { data } = await apiClient.patch(
        apiRoutes.governance.approvalRuleById.path.replace(":id", id),
        input,
      );
      return data.data;
    } catch {
      const ruleIndex = localRules.findIndex((r) => r.id === id);
      const existing = localRules[ruleIndex];
      if (ruleIndex < 0 || !existing) {
        throw new Error("Approval rule not found");
      }

      const updated: ApprovalChainRule = {
        ...existing,
        id: existing.id,
        name: input.name ?? existing.name,
        minScore: input.minScore ?? existing.minScore,
        maxScore:
          input.maxScore !== undefined ? input.maxScore : existing.maxScore,
        requiredLevels: input.requiredLevels ?? existing.requiredLevels,
        updatedAt: new Date().toISOString(),
      };
      localRules[ruleIndex] = updated;
      return updated;
    }
  },

  async deleteApprovalRule(id: string): Promise<void> {
    try {
      await apiClient.delete(
        apiRoutes.governance.approvalRuleById.path.replace(":id", id),
      );
    } catch {
      localRules = localRules.filter((r) => r.id !== id);
    }
  },

  // ─── Discount Simulation Engine ────────────────────────────────────────────
  async simulateDiscount(
    input: DiscountSimulationInput,
  ): Promise<DiscountSimulationResult> {
    // 1. Resolve Tier ceiling
    const tier = localTiers.find((t) => t.customerTier === input.customerTier);
    const tierCapPct = tier?.maxDiscountPct ?? 0;

    // 2. Resolve Category ceiling
    const cat = localCeilings.find((c) => c.category === input.category);
    const categoryCapPct = cat?.maxDiscountPct ?? 0;

    // 3. Applicable cap is the stricter of both (standard conservative risk governance)
    const applicableCapPct = Math.min(tierCapPct, categoryCapPct);
    const excessDiscountPct = Math.max(
      0,
      Number((input.requestedDiscountPct - applicableCapPct).toFixed(2)),
    );

    // 4. Blended risk score calculation (Module 4 engine approximation)
    // A 1% excess produces ~0.8 to 1.5 risk points depending on product category multiplier
    const categoryMultiplier: Record<ProductCategory, number> = {
      HARDWARE: 1.2,
      SERVICES: 0.9,
      SUBSCRIPTIONS: 1.0,
    };
    const tierTolerance: Record<CustomerTier, number> = {
      GOLD: 0.8,
      SILVER: 1.0,
      BRONZE: 1.2,
    };

    const multiplier =
      categoryMultiplier[input.category] * tierTolerance[input.customerTier];
    const blendedRiskScore =
      excessDiscountPct === 0
        ? 0
        : Number((excessDiscountPct * multiplier).toFixed(2));

    // 5. Match rule based on blendedRiskScore
    if (blendedRiskScore === 0) {
      return {
        tierCapPct,
        categoryCapPct,
        applicableCapPct,
        excessDiscountPct,
        blendedRiskScore,
        isAutoApproved: true,
        requiredApprovers: [],
        matchedRuleName: "Auto-Approved (Within Thresholds)",
      };
    }

    const matchedRule = localRules.find((rule) => {
      const passesMin = blendedRiskScore >= rule.minScore;
      const passesMax =
        rule.maxScore === null ||
        rule.maxScore === undefined ||
        blendedRiskScore < rule.maxScore;
      return passesMin && passesMax;
    });

    return {
      tierCapPct,
      categoryCapPct,
      applicableCapPct,
      excessDiscountPct,
      blendedRiskScore,
      isAutoApproved: false,
      requiredApprovers: matchedRule?.requiredLevels ?? ["SALES_MANAGER"],
      matchedRuleName: matchedRule?.name ?? "Default Escalation Rule",
    };
  },
};
