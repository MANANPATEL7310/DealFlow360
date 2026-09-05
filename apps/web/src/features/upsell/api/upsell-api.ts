import {
  apiRoutes,
  evaluateUpsellSuggestions,
  SEED_UPSELL_RULES,
  type UpsellSuggestionItem,
} from "@template/shared";
import { productsApi } from "@/features/products/api/products-api";
import { quotationsApi } from "@/features/quotations/api/quotations-api";
import { apiClient } from "@/services/http/api-client";

export const upsellApi = {
  async getSuggestions(quotationId: string): Promise<UpsellSuggestionItem[]> {
    try {
      const { data } = await apiClient.get(
        apiRoutes.upsell.list.path.replace(":id", quotationId),
      );
      return data.data;
    } catch {
      // Offline fallback: compute recommendations using shared engine
      const quotation = await quotationsApi.getQuotationById(quotationId);
      if (!quotation || quotation.lines.length === 0) {
        return [];
      }

      const allProducts = await productsApi.getProducts();
      return evaluateUpsellSuggestions(
        quotation,
        allProducts,
        SEED_UPSELL_RULES,
      );
    }
  },

  async addSuggestion(quotationId: string, suggestedProductId: string) {
    try {
      const { data } = await apiClient.post(
        apiRoutes.upsell.add.path
          .replace(":id", quotationId)
          .replace(":suggestedId", suggestedProductId),
      );
      return data.data;
    } catch {
      // Offline fallback: call quotationsApi.addLine directly
      return quotationsApi.addLine(quotationId, {
        productId: suggestedProductId,
        qty: 1,
        discountPct: 0,
        lineType: "ONE_TIME",
      });
    }
  },
};
