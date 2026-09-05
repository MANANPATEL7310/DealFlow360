// apps/api/src/modules/governance/governance.schema.ts
// Re-exports from @template/shared — single source of truth for validation contracts
export {
  approvalLevelSchema,
  customerTierSchema,
  productCategorySchema,
  upsertDiscountTierSchema,
  upsertCategoryCeilingSchema,
  createApprovalRuleSchema,
  updateApprovalRuleSchema,
  discountTierResponseSchema,
  categoryCeilingResponseSchema,
  approvalRuleResponseSchema,
  type ApprovalLevel,
  type CustomerTier,
  type ProductCategory,
  type UpsertDiscountTierInput,
  type UpsertCategoryCeilingInput,
  type CreateApprovalRuleInput,
  type UpdateApprovalRuleInput,
  type DiscountTierResponse,
  type CategoryCeilingResponse,
  type ApprovalRuleResponse,
} from "@template/shared";
