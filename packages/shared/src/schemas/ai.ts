import { z } from "zod";

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
