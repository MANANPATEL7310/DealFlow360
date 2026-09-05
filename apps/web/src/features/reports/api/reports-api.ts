import {
  apiRoutes,
  type ReportDataset,
  type ReportFilters,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";

export async function getSalesReport(
  filters: ReportFilters,
): Promise<ReportDataset> {
  const { data } = await apiClient.get(apiRoutes.reports.sales.path, {
    params: filters,
  });
  return data.data;
}

export async function downloadExport(
  format: "xlsx" | "pdf",
  filters: ReportFilters,
): Promise<void> {
  const path =
    format === "xlsx"
      ? apiRoutes.reports.exportXlsx.path
      : apiRoutes.reports.exportPdf.path;
  const response = await apiClient.get(path, {
    params: filters,
    responseType: "blob",
  });
  const disposition = response.headers["content-disposition"] as
    | string
    | undefined;
  const filename =
    disposition?.match(/filename="?([^"]+)"?/i)?.[1] ??
    `sales-report.${format}`;
  const href = URL.createObjectURL(
    new Blob([response.data], { type: response.headers["content-type"] }),
  );
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}
