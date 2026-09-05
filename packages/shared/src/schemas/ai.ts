import { z } from "zod";
import { reportFiltersSchema } from "./reports.js";

export const ApprovalRequestStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);
export type ApprovalRequestStatus = z.infer<typeof ApprovalRequestStatusEnum>;

export const ApprovalRequestKindEnum = z.enum([
  "DISCOUNT",
  "CREDIT_NOTE",
  "NUDGE",
  "NEGOTIATION",
  "FULFILLMENT_OVERRIDE",
]);
export type ApprovalRequestKind = z.infer<typeof ApprovalRequestKindEnum>;

export const ApprovalRequestSchema = z.object({
  id: z.string(),
  agent: z.string(),
  runId: z.string().nullable().optional(),
  quotationId: z.string().nullable().optional(),
  quotationNumber: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  kind: ApprovalRequestKindEnum,
  summary: z.string(),
  rationale: z.string().nullable().optional(),
  proposedAction: z.record(z.string(), z.unknown()),
  status: ApprovalRequestStatusEnum.default("PENDING"),
  decidedBy: z.string().nullable().optional(),
  decidedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;

export const HitlApprovalDecisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
  modifiedAction: z.record(z.string(), z.unknown()).optional(),
});
export type HitlApprovalDecision = z.infer<typeof HitlApprovalDecisionSchema>;

export const AiStatusSchema = z.object({
  enabled: z.boolean(),
  aiAvailable: z.boolean(),
  monthlyBudgetUsd: z.number(),
  spendUsd: z.number(),
  activeModel: z.string(),
  degradedReason: z.string().nullable().optional(),
  agentFlags: z.record(z.string(), z.boolean()).optional(),
});
export type AiStatus = z.infer<typeof AiStatusSchema>;

export const AgentRunStatusEnum = z.enum([
  "RUNNING",
  "DONE",
  "FAILED",
  "PAUSED_FOR_APPROVAL",
]);
export type AgentRunStatus = z.infer<typeof AgentRunStatusEnum>;

export const AgentRunSchema = z.object({
  id: z.string(),
  agent: z.string(),
  quotationId: z.string().nullable().optional(),
  status: AgentRunStatusEnum,
  model: z.string(),
  inputTokens: z.number().default(0),
  outputTokens: z.number().default(0),
  costUsd: z.number().default(0),
  latencyMs: z.number().default(0),
  result: z.unknown().optional(),
  error: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AgentRun = z.infer<typeof AgentRunSchema>;

export const ContextualSuggestionSchema = z.object({
  id: z.string(),
  agent: z.string(),
  title: z.string(),
  description: z.string(),
  actionLabel: z.string().optional(),
  actionType: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type ContextualSuggestion = z.infer<typeof ContextualSuggestionSchema>;

// ── Agent 1: AI Discount Approval Assistant ──
export const SimilarApprovedDealSchema = z.object({
  id: z.string(),
  quotationNumber: z.string(),
  customerName: z.string(),
  customerTier: z.string(),
  discountPct: z.number(),
  marginPct: z.number(),
  turnaroundHours: z.number(),
  status: z.string(),
});
export type SimilarApprovedDeal = z.infer<typeof SimilarApprovedDealSchema>;

export const DiscountReviewSchema = z.object({
  recommendation: z.enum(["APPROVE", "ADJUST", "REJECT"]),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  suggestedAdjustments: z
    .array(
      z.object({
        lineId: z.string().optional(),
        productName: z.string().optional(),
        currentDiscountPct: z.number(),
        suggestedDiscountPct: z.number(),
        reason: z.string(),
      }),
    )
    .optional(),
  similarDeals: z.array(SimilarApprovedDealSchema).default([]),
});
export type DiscountReview = z.infer<typeof DiscountReviewSchema>;

// ── Agent 6: AI Customer Negotiation Assistant ──
export const NegotiationEvaluationSchema = z.object({
  wouldAutoApprove: z.boolean(),
  requiredLevelsIfAccepted: z.array(z.string()),
  recommendedCounterPct: z.number().optional(),
  marginImpactPct: z.number(),
  draftMessage: z.string(),
  rationale: z.string(),
});
export type NegotiationEvaluation = z.infer<typeof NegotiationEvaluationSchema>;

// ── Agent 2: AI Product & Upsell Recommendation ──
export const AiUpsellTagSchema = z.enum([
  "HIGHEST_MARGIN",
  "FREQUENTLY_PAIRED",
  "ENTERPRISE_ADDON",
  "REDUCED_RISK",
]);
export type AiUpsellTag = z.infer<typeof AiUpsellTagSchema>;

export const AiUpsellRecommendationSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  category: z.string(),
  unitPriceMinor: z.number(),
  marginDeltaPct: z.number(),
  coPurchaseScore: z.number(),
  fitScore: z.number().min(0).max(100),
  reason: z.string(),
  tag: AiUpsellTagSchema,
});
export type AiUpsellRecommendation = z.infer<
  typeof AiUpsellRecommendationSchema
>;

export const AiUpsellResponseSchema = z.object({
  suggestions: z.array(AiUpsellRecommendationSchema),
  cartSummary: z.string().optional(),
});
export type AiUpsellResponse = z.infer<typeof AiUpsellResponseSchema>;

// ── Agent 5: AI Deal Health Monitor & Recovery Nudge Assistant ──
export const AiDealHealthPrioritySchema = z.enum([
  "P1_CRITICAL",
  "P2_ELEVATED",
  "P3_WATCH",
]);
export type AiDealHealthPriority = z.infer<typeof AiDealHealthPrioritySchema>;

export const AiDealHealthTriageAlertSchema = z.object({
  alertId: z.string(),
  quotationId: z.string(),
  quotationCode: z.string(),
  customerName: z.string(),
  customerTier: z.string(),
  priority: AiDealHealthPrioritySchema,
  whySummary: z.string(),
  escalationRiskScore: z.number().min(0).max(100),
  suggestedAction: z.string(),
  draftNudgeMessage: z.string(),
});
export type AiDealHealthTriageAlert = z.infer<
  typeof AiDealHealthTriageAlertSchema
>;

export const AiDealHealthTriageResponseSchema = z.object({
  triagedAlerts: z.array(AiDealHealthTriageAlertSchema),
  stalledDealsCount: z.number(),
  pipelineAtRiskMinor: z.number(),
  executiveSummary: z.string(),
});
export type AiDealHealthTriageResponse = z.infer<
  typeof AiDealHealthTriageResponseSchema
>;

export const AiDraftNudgeResponseSchema = z.object({
  alertId: z.string(),
  draftMessage: z.string(),
  tone: z.string(),
  suggestedSubject: z.string(),
});
export type AiDraftNudgeResponse = z.infer<typeof AiDraftNudgeResponseSchema>;

// ── Agent 3: AI Fulfillment Planner ──
export const AiFulfillmentProposalSchema = z.object({
  planId: z.string(),
  quotationId: z.string(),
  rationale: z.string(),
  estShipmentCostMinor: z.number(),
  estShipmentCount: z.number(),
  baselineCostMinor: z.number(),
  costDeltaMinor: z.number(),
  costDeltaPct: z.number(),
  transitDaysBenchmark: z.number(),
  tradeoffScore: z.number().min(0).max(100),
  requiresManagerApproval: z.boolean(),
  proposedSplits: z.array(
    z.object({
      warehouseId: z.string(),
      warehouseName: z.string(),
      productId: z.string(),
      productName: z.string(),
      qty: z.number(),
      shipmentCostMinor: z.number(),
    }),
  ),
  backorders: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      qtyOutstanding: z.number(),
      expectedDelayDays: z.number(),
    }),
  ),
});
export type AiFulfillmentProposal = z.infer<typeof AiFulfillmentProposalSchema>;

// ── Agent 4: AI Billing Assistant ──
export const AiBillingExplanationSchema = z.object({
  scheduleId: z.string(),
  quotationId: z.string(),
  executiveSummary: z.string(),
  upfrontChargesBreakdown: z.string(),
  recurringSchedulesBreakdown: z.string(),
  taxAndMarginAudit: z.string(),
  prorationPolicyVerified: z.boolean(),
  nextPaymentMilestone: z.string().optional(),
});
export type AiBillingExplanation = z.infer<typeof AiBillingExplanationSchema>;

export const AiDraftCreditNoteRequestSchema = z.object({
  quotationId: z.string(),
  scheduleId: z.string(),
  sourceInvoiceId: z.string().optional(),
  suggestedAmountMinor: z.number().int().positive(),
  reason: z.string().min(1),
});
export type AiDraftCreditNoteRequest = z.infer<
  typeof AiDraftCreditNoteRequestSchema
>;

export const AiDraftCreditNoteResponseSchema = z.object({
  approvalRequestId: z.string(),
  amountMinor: z.number(),
  reason: z.string(),
  sourceInvoiceId: z.string().optional(),
  stagedInHitlQueue: z.boolean(),
  financeReviewerNote: z.string(),
});
export type AiDraftCreditNoteResponse = z.infer<
  typeof AiDraftCreditNoteResponseSchema
>;

// ── Agent 7: AI Sales Insights & NL Reporting ──
export const AiNaturalLanguageQueryRequestSchema = z.object({
  prompt: z.string().min(1),
  currentFilters: reportFiltersSchema.optional(),
});
export type AiNaturalLanguageQueryRequest = z.infer<
  typeof AiNaturalLanguageQueryRequestSchema
>;

export const AiNaturalLanguageQueryResponseSchema = z.object({
  queryIntent: z.string(),
  executiveNarrative: z.string(),
  appliedFilters: reportFiltersSchema,
  metricsSummary: z.object({
    totalRevenueMinor: z.number(),
    marginPct: z.number(),
    discountErosionMinor: z.number(),
    winRatePct: z.number(),
  }),
  keyTakeaways: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  suggestedQuestions: z.array(z.string()),
});
export type AiNaturalLanguageQueryResponse = z.infer<
  typeof AiNaturalLanguageQueryResponseSchema
>;
