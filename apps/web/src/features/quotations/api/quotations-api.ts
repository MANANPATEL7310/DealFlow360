import {
  type AddLineInput,
  apiRoutes,
  type ApprovalDecisionInput,
  type CreateQuotationInput,
  type Quotation,
  type QuotationLine,
  type QuotationRiskEvaluation,
  type UpdateLineInput,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export interface QuotationFilterParams {
  status?: string;
  query?: string;
  customerId?: string;
}

export const quotationsApi = {
  async getQuotations(params?: QuotationFilterParams): Promise<Quotation[]> {
    const { data } = await apiClient.get(apiRoutes.quotations.list.path, {
      params,
    });
    return data.data;
  },
  async getQuotationById(id: string): Promise<Quotation | null> {
    const { data } = await apiClient.get(
      apiRoutes.quotations.getById.path.replace(":id", id),
    );
    return data.data;
  },
  async createQuotation(input: CreateQuotationInput): Promise<Quotation> {
    const { data } = await apiClient.post(
      apiRoutes.quotations.create.path,
      input,
    );
    return data.data;
  },
  async updateQuotation(
    id: string,
    updates: Partial<Quotation>,
  ): Promise<Quotation> {
    const { data } = await apiClient.patch(
      apiRoutes.quotations.update.path.replace(":id", id),
      updates,
    );
    return data.data;
  },
  async addLine(
    quotationId: string,
    input: AddLineInput,
  ): Promise<QuotationLine> {
    const { data } = await apiClient.post(
      apiRoutes.quotations.addLine.path.replace(":id", quotationId),
      input,
    );
    return data.data;
  },
  async updateLine(
    quotationId: string,
    lineId: string,
    input: UpdateLineInput,
  ): Promise<QuotationLine> {
    const { data } = await apiClient.patch(
      apiRoutes.quotations.updateLine.path
        .replace(":id", quotationId)
        .replace(":lineId", lineId),
      input,
    );
    return data.data;
  },
  async deleteLine(quotationId: string, lineId: string): Promise<void> {
    await apiClient.delete(
      apiRoutes.quotations.removeLine.path
        .replace(":id", quotationId)
        .replace(":lineId", lineId),
    );
  },
  async getQuotationRisk(id: string): Promise<QuotationRiskEvaluation> {
    const { data } = await apiClient.get(
      apiRoutes.quotations.risk.path.replace(":id", id),
    );
    return data.data;
  },
  async confirmQuotation(id: string) {
    const { data } = await apiClient.post(
      apiRoutes.quotations.confirm.path.replace(":id", id),
    );
    return data.data;
  },
  async decideApproval(
    quotationId: string,
    input: ApprovalDecisionInput,
    _actor?: { id: string; role: string; name?: string },
  ) {
    const { data } = await apiClient.post(
      apiRoutes.approvals.decision.path.replace(":id", quotationId),
      input,
    );
    return data.data;
  },
};
