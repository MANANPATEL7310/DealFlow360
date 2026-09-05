import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { QUOTATIONS_QUERY_KEY } from "@/features/quotations/hooks/use-quotations";
import { upsellApi } from "@/features/upsell/api/upsell-api";

export const UPSELL_QUERY_KEY = ["upsell"] as const;

export function useUpsell(quotationId?: string) {
  return useQuery({
    queryKey: [...UPSELL_QUERY_KEY, quotationId],
    queryFn: () => (quotationId ? upsellApi.getSuggestions(quotationId) : []),
    enabled: Boolean(quotationId),
    staleTime: 10000,
  });
}

export function useAddUpsell(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestedProductId: string) =>
      upsellApi.addSuggestion(quotationId, suggestedProductId),
    onSuccess: (data) => {
      // Invalidate quotations so builder totals, lines, and margin gauge immediately refresh
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      // Invalidate upsell suggestions so the accepted product drops off
      queryClient.invalidateQueries({
        queryKey: [...UPSELL_QUERY_KEY, quotationId],
      });

      const productName = data?.product?.name ?? "Add-on";
      toast.success(`Added ${productName} to quotation!`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Could not add recommended add-on.");
    },
  });
}
