import { apiRoutes, type UpsellSuggestionItem } from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export const upsellApi = {
  async getSuggestions(quotationId: string): Promise<UpsellSuggestionItem[]> {
    const { data } = await apiClient.get(
      apiRoutes.upsell.list.path.replace(":id", quotationId),
    );
    return data.data;
  },
  async addSuggestion(quotationId: string, suggestedId: string) {
    const { data } = await apiClient.post(
      apiRoutes.upsell.add.path
        .replace(":id", quotationId)
        .replace(":suggestedId", suggestedId),
    );
    return data.data;
  },
};
