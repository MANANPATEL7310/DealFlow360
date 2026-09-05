import type { ReportFilters } from "./reports.schema.js";

/** Convert minor units (cents) to major unit number (dollars) for Excel/PDF rendering */
export const toMajor = (minor: number): number =>
  Number((minor / 100).toFixed(2));

/** Generate formatted report filename based on filter bounds */
export function reportFilename(ext: "xlsx" | "pdf", f: ReportFilters): string {
  const from = f.from
    ? new Date(f.from).toISOString().slice(0, 10)
    : "all-start";
  const to = f.to ? new Date(f.to).toISOString().slice(0, 10) : "today";
  return `sales-report_${from}_${to}.${ext}`;
}
