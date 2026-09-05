import type { ReportFilters } from "./reports.schema.js";

export function toMajor(minor: number): number {
  return minor / 100;
}

export function reportFilename(ext: "xlsx" | "pdf", filters: ReportFilters) {
  const from = filters.from
    ? new Date(filters.from).toISOString().slice(0, 10)
    : "start";
  const to = filters.to
    ? new Date(filters.to).toISOString().slice(0, 10)
    : "today";

  return `sales-report_${from}_${to}.${ext}`;
}
