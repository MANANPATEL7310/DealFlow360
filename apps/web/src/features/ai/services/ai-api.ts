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
  AiUpsellResponse,
  AiDealHealthTriageResponse,
  AiDraftNudgeResponse,
  AiFulfillmentProposal,
  AiBillingExplanation,
  AiDraftCreditNoteRequest,
  AiDraftCreditNoteResponse,
  AiNaturalLanguageQueryResponse,
  ReportFilters,
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
  lineId?: string | null,
): Promise<NegotiationEvaluation> {
  const { data } = await apiClient.post<NegotiationEvaluation>(
    apiRoutes.ai.negotiationEvaluate.path,
    { quotationId, counterDiscountPct, lineId: lineId ?? undefined },
  );
  return data;
}

export async function fetchAiUpsellRecommendations(
  quotationId: string,
): Promise<AiUpsellResponse> {
  const { data } = await apiClient.post<AiUpsellResponse>(
    apiRoutes.ai.upsellRecommendations.path,
    { quotationId },
  );
  return data;
}

export async function fetchAiDealHealthTriage(): Promise<AiDealHealthTriageResponse> {
  const { data } = await apiClient.post<AiDealHealthTriageResponse>(
    apiRoutes.ai.dealHealthTriage.path,
    {},
  );
  return data;
}

export async function fetchAiDraftNudge(
  alertId: string,
  tone?: string,
): Promise<AiDraftNudgeResponse> {
  const { data } = await apiClient.post<AiDraftNudgeResponse>(
    apiRoutes.ai.draftNudge.path,
    { alertId, tone },
  );
  return data;
}

export async function fetchAiFulfillmentProposal(
  quotationId: string,
): Promise<AiFulfillmentProposal> {
  const { data } = await apiClient.post<AiFulfillmentProposal>(
    apiRoutes.ai.fulfillmentOptimize.path,
    { quotationId },
  );
  return data;
}

export async function fetchAiBillingExplanation(
  quotationId: string,
): Promise<AiBillingExplanation> {
  const { data } = await apiClient.post<AiBillingExplanation>(
    apiRoutes.ai.billingExplain.path,
    { quotationId },
  );
  return data;
}

export async function requestAiCreditNoteDraft(
  payload: AiDraftCreditNoteRequest,
): Promise<AiDraftCreditNoteResponse> {
  const { data } = await apiClient.post<AiDraftCreditNoteResponse>(
    apiRoutes.ai.draftCreditNote.path,
    payload,
  );
  return data;
}

export async function fetchAiNaturalLanguageReportQuery(
  prompt: string,
  currentFilters?: ReportFilters,
): Promise<AiNaturalLanguageQueryResponse> {
  const { data } = await apiClient.post<AiNaturalLanguageQueryResponse>(
    apiRoutes.ai.nlQuery.path,
    { prompt, currentFilters },
  );
  return data;
}
