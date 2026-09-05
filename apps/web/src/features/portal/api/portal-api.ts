import {
  apiRoutes,
  type AnswerNegotiationInput,
  type CreateNegotiationInput,
  type NegotiationRequest,
  type PortalConfirmResult,
  type PortalQuotationView,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import { portalHttp } from "./portal-client";

export const portalApi = {
  async getQuotation(): Promise<PortalQuotationView> {
    const { data } = await portalHttp.get(apiRoutes.portal.quotation.path);
    return data.data;
  },

  async markOpened(): Promise<{ status: string }> {
    const { data } = await portalHttp.post(apiRoutes.portal.open.path);
    return data.data;
  },

  async createNegotiation(
    input: CreateNegotiationInput,
  ): Promise<NegotiationRequest> {
    const { data } = await portalHttp.post(
      apiRoutes.portal.negotiations.path,
      input,
    );
    return data.data;
  },

  async confirmProposal(): Promise<PortalConfirmResult> {
    const { data } = await portalHttp.post(apiRoutes.portal.confirm.path);
    return data.data;
  },

  async submitNegotiation(
    input: CreateNegotiationInput,
  ): Promise<PortalQuotationView> {
    await this.createNegotiation(input);
    return this.getQuotation();
  },

  async confirmQuotation(): Promise<PortalConfirmResult> {
    return this.confirmProposal();
  },

  async sendQuotation(
    quotationId: string,
    contactId?: string,
  ): Promise<{ token: string; url?: string; magicLink?: string }> {
    const { data } = await apiClient.post(
      apiRoutes.quotations.send.path.replace(":id", quotationId),
      { contactId },
    );
    return data.data;
  },

  async getInternalNegotiations(
    quotationId: string,
  ): Promise<NegotiationRequest[]> {
    const { data } = await apiClient.get(
      apiRoutes.quotations.negotiations.path.replace(":id", quotationId),
    );
    return data.data;
  },

  async answerNegotiation(
    quotationId: string,
    negotiationId: string,
    input: AnswerNegotiationInput,
  ): Promise<NegotiationRequest> {
    const { data } = await apiClient.post(
      apiRoutes.quotations.answerNegotiation.path
        .replace(":id", quotationId)
        .replace(":negId", negotiationId),
      input,
    );
    return data.data;
  },
};
