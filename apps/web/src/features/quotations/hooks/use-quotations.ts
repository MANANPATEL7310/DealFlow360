import type {
  AddLineInput,
  CreateQuotationInput,
  UpdateLineInput,
} from "@template/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  type QuotationFilterParams,
  quotationsApi,
} from "@/features/quotations/api/quotations-api";

export const QUOTATIONS_QUERY_KEY = ["quotations"] as const;

export function useQuotations(params?: QuotationFilterParams) {
  return useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, params],
    queryFn: () => quotationsApi.getQuotations(params),
    staleTime: 20000,
  });
}

export function useQuotation(id?: string) {
  return useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, "detail", id],
    queryFn: () => (id ? quotationsApi.getQuotationById(id) : null),
    enabled: Boolean(id),
    staleTime: 10000,
  });
}

export function useQuotationRisk(id?: string) {
  return useQuery({
    queryKey: [...QUOTATIONS_QUERY_KEY, "risk", id],
    queryFn: () => (id ? quotationsApi.getQuotationRisk(id) : null),
    enabled: Boolean(id),
    staleTime: 5000,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateQuotationInput) =>
      quotationsApi.createQuotation(input),
    onSuccess: (newQuote) => {
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      toast.success(`Draft quotation ${newQuote.quotationNumber} initialized.`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create quotation.");
    },
  });
}

export function useAddLine(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddLineInput) =>
      quotationsApi.addLine(quotationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "detail", quotationId],
      });
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "risk", quotationId],
      });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      toast.success("Line item added to quotation.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add line item.");
    },
  });
}

export function useUpdateLine(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lineId,
      input,
    }: {
      lineId: string;
      input: UpdateLineInput;
    }) => quotationsApi.updateLine(quotationId, lineId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "detail", quotationId],
      });
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "risk", quotationId],
      });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update line item.");
    },
  });
}

export function useDeleteLine(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lineId: string) =>
      quotationsApi.deleteLine(quotationId, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "detail", quotationId],
      });
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "risk", quotationId],
      });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });
      toast.success("Line item removed.");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to remove line item.");
    },
  });
}

export function useConfirmQuotation(quotationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => quotationsApi.confirmQuotation(quotationId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "detail", quotationId],
      });
      queryClient.invalidateQueries({
        queryKey: [...QUOTATIONS_QUERY_KEY, "risk", quotationId],
      });
      queryClient.invalidateQueries({ queryKey: QUOTATIONS_QUERY_KEY });

      if (res.status === "APPROVED") {
        toast.success(res.message);
      } else {
        toast(res.message, {
          icon: "⚠️",
        });
      }
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Quotation confirmation failed.");
    },
  });
}
