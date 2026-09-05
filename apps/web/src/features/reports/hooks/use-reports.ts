import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ReportFilters } from "@template/shared";
import { downloadExport, getSalesReport } from "../api/reports-api";

export function useSalesReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", "sales", filters],
    queryFn: () => getSalesReport(filters),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: "xlsx" | "pdf";
      filters: ReportFilters;
    }) => downloadExport(format, filters),
    onSuccess: (_data, variables) => {
      toast.success(`${variables.format.toUpperCase()} export completed.`);
    },
    onError: () => {
      toast.error("Export generation failed. Please try again.");
    },
  });
}
