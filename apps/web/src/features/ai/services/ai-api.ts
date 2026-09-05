import { apiClient } from "@/services/http/api-client";
import { apiRoutes } from "@template/shared";
import type {
  AiStatus,
  ApprovalRequest,
  HitlApprovalDecision,
  AgentRun,
  ContextualSuggestion,
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
