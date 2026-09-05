import type { ApprovalDecisionInput } from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { approvalsApi } from "@/features/approvals/api/approvals-api";
import { QUOTATIONS_QUERY_KEY } from "@/features/quotations/hooks/use-quotations";
import { useAuthStore } from "@/stores/auth-store";

export const APPROVALS_QUERY_KEY = ["approvals"] as const;

export function usePendingApprovals() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...APPROVALS_QUERY_KEY, "inbox", user?.role],
    queryFn: () => approvalsApi.getPendingApprovals(user?.role),
    staleTime: 15000,
  });
}

export function useApprovalDetails(quotationId?: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...APPROVALS_QUERY_KEY, "detail", quotationId, user?.role],
    queryFn: () =>
      quotationId
        ? approvalsApi.getApprovalDetails(quotationId, user?.role)
        : null,
    enabled: Boolean(quotationId),
    staleTime: 10000,
  });
}

export function useSubmitApprovalDecision(quotationId: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: ApprovalDecisionInput) =>
      approvalsApi.submitDecision(
        quotationId,
        input,
        user ?? { id: "usr-guest", role: "sales_manager", name: "Reviewer" },
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });

      if (res.decision === "APPROVED") {
        toast.success(res.message);
      } else if (res.decision === "RETURNED") {
        toast(res.message, { icon: "↩️" });
      } else {
        toast.error(res.message);
      }
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to submit approval decision.");
    },
  });
}
