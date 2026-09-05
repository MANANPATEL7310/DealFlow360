import ExcelJS from "exceljs";
import type { Response } from "express";
import type { ReportDataset } from "./report-dataset.js";
import { reportFilename, toMajor } from "./export.util.js";
import type { ReportFilters } from "./reports.schema.js";

const MONEY_FORMAT = "#,##0.00";

export async function writeXlsx(
  res: Response,
  data: ReportDataset,
  filters: ReportFilters,
) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportFilename("xlsx", filters)}"`,
  );

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
  });
  workbook.creator = "DealFlow360";

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Value", key: "value", width: 20 },
  ];

  const rows: { metric: string; value: number | string; money?: boolean }[] = [
    { metric: "Quotes", value: data.summary.quoteCount },
    { metric: "Gross", value: toMajor(data.summary.grossMinor), money: true },
    { metric: "Net", value: toMajor(data.summary.netMinor), money: true },
    {
      metric: "Discount amount",
      value: toMajor(data.summary.discountMinor),
      money: true,
    },
    {
      metric: "Discount %",
      value: Number(data.summary.discountPct.toFixed(2)),
    },
    { metric: "Margin %", value: Number(data.summary.marginPct.toFixed(2)) },
  ];

  for (const item of rows) {
    const row = summary.addRow({ metric: item.metric, value: item.value });
    if (item.money) {
      row.getCell("value").numFmt = MONEY_FORMAT;
    }
    row.commit();
  }
  summary.commit();

  const funnel = workbook.addWorksheet("Funnel");
  funnel.columns = [
    { header: "Stage", key: "status", width: 22 },
    { header: "Count", key: "count", width: 12 },
    { header: "Net", key: "net", width: 18 },
  ];

  for (const stage of data.funnel) {
    const row = funnel.addRow({
      status: stage.status,
      count: stage.count,
      net: toMajor(stage.netMinor),
    });
    row.getCell("net").numFmt = MONEY_FORMAT;
    row.commit();
  }
  funnel.commit();

  await workbook.commit();
}
