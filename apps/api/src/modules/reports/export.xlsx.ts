import ExcelJS from "exceljs";
import type { Response } from "express";
import { reportFilename, toMajor } from "./export.util.js";
import type { ReportDataset, ReportFilters } from "./reports.schema.js";

export async function writeXlsx(
  res: Response,
  data: ReportDataset,
  filters: ReportFilters,
): Promise<void> {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportFilename("xlsx", filters)}"`,
  );

  // Stream directly to Express HTTP response stream
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  workbook.creator = "DealFlow360 Executive Suite";

  const moneyFmt = "$#,##0.00";
  const pctFmt = '0.00"%"';

  // ── Sheet 1: Executive Summary ─────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Executive Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 28 },
    { header: "Value", key: "value", width: 22 },
  ];

  const summaryRows: [string, number | string, string?][] = [
    ["Total Quotations", data.summary.quoteCount],
    ["Gross Revenue", toMajor(data.summary.grossMinor), moneyFmt],
    ["Net Revenue", toMajor(data.summary.netMinor), moneyFmt],
    ["Total Cost of Goods", toMajor(data.summary.costMinor), moneyFmt],
    ["Discount Concessions", toMajor(data.summary.discountMinor), moneyFmt],
    ["Average Discount %", data.summary.discountPct, pctFmt],
    ["Realized Margin %", data.summary.marginPct, pctFmt],
  ];

  for (const [metric, value, fmt] of summaryRows) {
    const row = summarySheet.addRow({ metric, value });
    if (fmt) {
      row.getCell("value").numFmt = fmt;
    }
    row.commit();
  }
  summarySheet.commit();

  // ── Sheet 2: Pipeline Funnel ───────────────────────────────────────────────
  const funnelSheet = workbook.addWorksheet("Pipeline Funnel");
  funnelSheet.columns = [
    { header: "Lifecycle Stage", key: "stage", width: 26 },
    { header: "Deal Count", key: "count", width: 14 },
    { header: "Net Volume ($)", key: "net", width: 20 },
  ];

  for (const f of data.funnel) {
    const row = funnelSheet.addRow({
      stage: f.status.replace(/_/g, " "),
      count: f.count,
      net: toMajor(f.netMinor),
    });
    row.getCell("net").numFmt = moneyFmt;
    row.commit();
  }
  funnelSheet.commit();

  // ── Sheet 3: Category Contributions ────────────────────────────────────────
  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    const categorySheet = workbook.addWorksheet("Category Contribution");
    categorySheet.columns = [
      { header: "Product Category", key: "category", width: 24 },
      { header: "Line Items", key: "lines", width: 14 },
      { header: "Gross Revenue ($)", key: "gross", width: 20 },
      { header: "Net Revenue ($)", key: "net", width: 20 },
      { header: "Margin %", key: "margin", width: 14 },
    ];

    for (const c of data.categoryBreakdown) {
      const row = categorySheet.addRow({
        category: c.categoryName,
        lines: c.lineCount,
        gross: toMajor(c.grossMinor),
        net: toMajor(c.netMinor),
        margin: c.marginPct,
      });
      row.getCell("gross").numFmt = moneyFmt;
      row.getCell("net").numFmt = moneyFmt;
      row.getCell("margin").numFmt = pctFmt;
      row.commit();
    }
    categorySheet.commit();
  }

  // Finalizes XLSX package and closes HTTP response stream
  await workbook.commit();
}
