import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRoutes } from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import type { ApprovalItem, DecideApprovalPayload } from "../types";

export const approvalsKeys = {
  all: ["approvals"] as const,
  list: (status?: string) => ["approvals", "list", status ?? "ALL"] as const,
};

/**
 * The /ai/approvals path is served by two backends: a mock router that returns
 * a raw array, and the real DB-backed router that returns a { success, data }
 * envelope. Unwrap defensively so the inbox works regardless of which answers.
 */
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export function useApprovals(status?: string) {
  return useQuery({
    queryKey: approvalsKeys.list(status),
    queryFn: async () => {
      const response = await apiClient.get<unknown>(
        apiRoutes.aiApprovals.list.path,
        {
          params: status && status !== "ALL" ? { status } : undefined,
        },
      );
      return unwrapList<ApprovalItem>(response.data);
    },
    refetchInterval: 10000,
  });
}

export function useDecideApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: DecideApprovalPayload;
    }) => {
      const url = apiRoutes.aiApprovals.decision.path.replace(":id", id);
      const response = await apiClient.post<unknown>(url, payload);
      // Real router returns { success, data }; mock returns the object raw.
      const body = response.data;
      if (body && typeof body === "object" && "data" in body) {
        return (body as { data: unknown }).data;
      }
      return body;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: approvalsKeys.all });
    },
  });
}
