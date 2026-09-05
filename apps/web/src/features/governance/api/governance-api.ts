import {
  apiRoutes,
  type ApprovalChainRule,
  type CategoryDiscountCeiling,
  type CreateApprovalRuleInput,
  type DiscountTierCeiling,
  type UpdateApprovalRuleInput,
  type UpsertCategoryCeilingInput,
  type UpsertDiscountTierInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const governanceApi = {
  async getDiscountTiers(): Promise<DiscountTierCeiling[]> {
    const { data } = await apiClient.get(
      apiRoutes.governance.discountTiers.path,
    );
    return data.data;
  },
  async upsertDiscountTier(
    input: UpsertDiscountTierInput,
  ): Promise<DiscountTierCeiling> {
    const { data } = await apiClient.put(
      apiRoutes.governance.upsertDiscountTier.path,
      input,
    );
    return data.data;
  },
  async getCategoryCeilings(): Promise<CategoryDiscountCeiling[]> {
    const { data } = await apiClient.get(
      apiRoutes.governance.categoryCeilings.path,
    );
    return data.data;
  },
  async upsertCategoryCeiling(
    input: UpsertCategoryCeilingInput,
  ): Promise<CategoryDiscountCeiling> {
    const { data } = await apiClient.put(
      apiRoutes.governance.upsertCategoryCeiling.path,
      input,
    );
    return data.data;
  },
  async getApprovalRules(): Promise<ApprovalChainRule[]> {
    const { data } = await apiClient.get(
      apiRoutes.governance.approvalRules.path,
    );
    return data.data;
  },
  async createApprovalRule(
    input: CreateApprovalRuleInput,
  ): Promise<ApprovalChainRule> {
    const { data } = await apiClient.post(
      apiRoutes.governance.createApprovalRule.path,
      input,
    );
    return data.data;
  },
  async updateApprovalRule(
    id: string,
    input: UpdateApprovalRuleInput,
  ): Promise<ApprovalChainRule> {
    const { data } = await apiClient.patch(
      apiRoutes.governance.updateApprovalRule.path.replace(":id", id),
      input,
    );
    return data.data;
  },
  async deleteApprovalRule(id: string): Promise<void> {
    await apiClient.delete(
      apiRoutes.governance.removeApprovalRule.path.replace(":id", id),
    );
  },
  async simulateDiscount(input: {
    customerTier: DiscountTierCeiling["customerTier"];
    category: CategoryDiscountCeiling["category"];
    requestedDiscountPct: number;
  }) {
    const [tiers, ceilings, rules] = await Promise.all([
      this.getDiscountTiers(),
      this.getCategoryCeilings(),
      this.getApprovalRules(),
    ]);
    const tier = tiers.find((item) => item.customerTier === input.customerTier);
    const ceiling = ceilings.find((item) => item.category === input.category);
    const tierCapPct = tier?.maxDiscountPct ?? 0;
    const categoryCapPct = ceiling?.maxDiscountPct ?? 0;
    const applicableCapPct = Math.min(tierCapPct, categoryCapPct);
    const excessDiscountPct = Math.max(
      0,
      input.requestedDiscountPct - applicableCapPct,
    );
    const rule = rules.find(
      (item) =>
        excessDiscountPct >= item.minScore &&
        (item.maxScore == null || excessDiscountPct <= item.maxScore),
    );
    return {
      tierCapPct,
      categoryCapPct,
      applicableCapPct,
      excessDiscountPct,
      blendedRiskScore: excessDiscountPct,
      isAutoApproved: excessDiscountPct === 0,
      requiredApprovers: rule?.requiredLevels ?? [],
      matchedRuleName: rule?.name,
    };
  },
};
