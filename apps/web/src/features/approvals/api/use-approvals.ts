import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRoutes } from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import type { ApprovalItem, DecideApprovalPayload } from "../types";

export const approvalsKeys = {
  all: ["approvals"] as const,
  list: (status?: string) => ["approvals", "list", status ?? "ALL"] as const,
};

export function useApprovals(status?: string) {
  return useQuery({
    queryKey: approvalsKeys.list(status),
    queryFn: async () => {
      const response = await apiClient.get<
        ApprovalItem[] | { success: boolean; data: ApprovalItem[] }
      >(apiRoutes.aiApprovals.list.path, {
        params: status && status !== "ALL" ? { status } : undefined,
      });
      // This endpoint returns a bare array; other endpoints wrap in { data }.
      const body = response.data;
      return Array.isArray(body) ? body : (body.data ?? []);
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
      const response = await apiClient.post<{
        success: boolean;
        data: unknown;
      }>(url, payload);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: approvalsKeys.all });
    },
  });
}
