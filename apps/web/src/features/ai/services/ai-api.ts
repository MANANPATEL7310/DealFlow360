import { apiClient } from "@/services/http/api-client";
import { apiRoutes } from "@template/shared";
import type {
  AiStatus,
  ApprovalRequest,
  HitlApprovalDecision,
  AgentRun,
  ContextualSuggestion,
  DiscountReview,
  NegotiationEvaluation,
} from "@template/shared";

export async function fetchAiStatus(): Promise<AiStatus> {
  const { data } = await apiClient.get<AiStatus>(apiRoutes.ai.status.path);
  return data;
}

export async function fetchApprovalRequests(
  status?: string,
): Promise<ApprovalRequest[]> {
  const { data } = await apiClient.get<ApprovalRequest[]>(
    apiRoutes.ai.approvals.path,
    {
      params: status ? { status } : undefined,
    },
  );
  return data;
}

export async function decideApproval(
  id: string,
  payload: HitlApprovalDecision,
): Promise<ApprovalRequest> {
  const path = apiRoutes.ai.decideApproval.path.replace(":id", id);
  const { data } = await apiClient.post<ApprovalRequest>(path, payload);
  return data;
}

export async function fetchAgentRuns(limit = 20): Promise<AgentRun[]> {
  const { data } = await apiClient.get<AgentRun[]>(apiRoutes.ai.runs.path, {
    params: { limit },
  });
  return data;
}

export async function fetchContextualSuggestions(
  path: string,
): Promise<ContextualSuggestion[]> {
  const { data } = await apiClient.post<ContextualSuggestion[]>(
    apiRoutes.ai.contextual.path,
    { path },
  );
  return data;
}

export async function fetchDiscountReview(
  quotationId: string,
): Promise<DiscountReview> {
  const { data } = await apiClient.post<DiscountReview>(
    apiRoutes.ai.discountReview.path,
    { quotationId },
  );
  return data;
}

export async function fetchNegotiationEvaluation(
  quotationId: string,
  counterDiscountPct: number,
  lineId?: string,
): Promise<NegotiationEvaluation> {
  const { data } = await apiClient.post<NegotiationEvaluation>(
    apiRoutes.ai.negotiationEvaluate.path,
    { quotationId, counterDiscountPct, lineId },
  );
  return data;
}
