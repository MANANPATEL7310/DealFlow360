import {
  apiRoutes,
  type ApprovalDecisionInput,
  type Quotation,
  type QuotationApprovalStep,
  type QuotationRiskEvaluation,
  type UserRole,
} from "@template/shared";
import { quotationsApi } from "@/features/quotations/api/quotations-api";
import { apiClient } from "@/services/http/api-client";

export interface ApprovalQueueItem {
  quotation: Quotation;
  currentStep: QuotationApprovalStep | null;
  canReview: boolean;
  requiredRoleLabel: string;
}

export interface ApprovalDetailsResponse {
  quotation: Quotation;
  risk: QuotationRiskEvaluation | null;
  currentStep: QuotationApprovalStep | null;
  canReview: boolean;
}

function checkCanReview(
  stepLevel: string | undefined,
  userRole: UserRole | undefined,
): boolean {
  if (!stepLevel || !userRole) return false;
  if (userRole === "admin") return true;
  if (stepLevel === "SALES_MANAGER" && userRole === "sales_manager")
    return true;
  if (stepLevel === "FINANCE" && userRole === "finance") return true;
  return false;
}

function getRequiredRoleLabel(stepLevel: string | undefined): string {
  if (stepLevel === "SALES_MANAGER") return "Sales Manager";
  if (stepLevel === "FINANCE") return "Finance Lead";
  return "Reviewer";
}

export const approvalsApi = {
  async getPendingApprovals(userRole?: UserRole): Promise<ApprovalQueueItem[]> {
    try {
      const { data } = await apiClient.get(apiRoutes.approvals.inbox.path);
      return data.data;
    } catch {
      const allQuotes = await quotationsApi.getQuotations({
        status: "PENDING_APPROVAL",
      });

      return allQuotes.map((q) => {
        const currentStep =
          q.approvals.find((s) => s.decision === "PENDING") ?? null;
        const canReview = checkCanReview(currentStep?.level, userRole);
        const requiredRoleLabel = getRequiredRoleLabel(currentStep?.level);

        return {
          quotation: q,
          currentStep,
          canReview,
          requiredRoleLabel,
        };
      });
    }
  },

  async getApprovalDetails(
    quotationId: string,
    userRole?: UserRole,
  ): Promise<ApprovalDetailsResponse> {
    const quotation = await quotationsApi.getQuotationById(quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const risk = await quotationsApi.getQuotationRisk(quotationId);
    const currentStep =
      quotation.approvals.find((s) => s.decision === "PENDING") ?? null;
    const canReview = checkCanReview(currentStep?.level, userRole);

    return {
      quotation,
      risk,
      currentStep,
      canReview,
    };
  },

  async submitDecision(
    quotationId: string,
    input: ApprovalDecisionInput,
    actor: { id: string; role: string; name?: string },
  ) {
    return quotationsApi.decideApproval(quotationId, input, actor);
  },
};
