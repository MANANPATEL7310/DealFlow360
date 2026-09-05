import {
  type ApprovalDecisionInput,
  type Quotation,
  type QuotationApprovalStep,
  type QuotationRiskEvaluation,
  type UserRole,
} from "@template/shared";
import { quotationsApi } from "@/features/quotations/api/quotations-api";

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
    const summaries = await quotationsApi.getQuotations({
      status: "PENDING_APPROVAL",
    });
    const quotations = await Promise.all(
      summaries.map((quotation) =>
        quotationsApi.getQuotationById(quotation.id),
      ),
    );
    return quotations
      .filter((quotation): quotation is Quotation => quotation !== null)
      .map((quotation) => {
        const currentStep =
          quotation.approvals.find((step) => step.decision === "PENDING") ??
          null;
        return {
          quotation,
          currentStep,
          canReview: checkCanReview(currentStep?.level, userRole),
          requiredRoleLabel: getRequiredRoleLabel(currentStep?.level),
        };
      });
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
