import type { Response } from "express";
import PDFDocument from "pdfkit";
import type { ReportDataset } from "./report-dataset.js";
import { reportFilename, toMajor } from "./export.util.js";
import type { ReportFilters } from "./reports.schema.js";

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function filterSummary(data: ReportDataset, filters: ReportFilters) {
  return [
    `Period ${filters.from ? filters.from.toISOString().slice(0, 10) : "start"} to ${
      filters.to ? filters.to.toISOString().slice(0, 10) : "today"
    }`,
    data.filters.effectiveRepId ? `Rep ${data.filters.effectiveRepId}` : null,
    filters.status ? `Status ${filters.status}` : null,
    filters.category ? `Category ${filters.category}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function writePdf(
  res: Response,
  data: ReportDataset,
  filters: ReportFilters,
) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportFilename("pdf", filters)}"`,
  );

  const doc = new PDFDocument({ margin: 48, size: "A4" });
  doc.pipe(res);

  doc.fontSize(20).text("Sales Report", { align: "left" });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#666666").text(filterSummary(data, filters));
  doc.fillColor("#000000").moveDown(1);

  const summary = data.summary;
  doc.fontSize(13).text("Summary");
  doc.moveDown(0.3).fontSize(11);
  doc.text(`Quotes: ${summary.quoteCount}`);
  doc.text(`Gross: ${money(toMajor(summary.grossMinor))}`);
  doc.text(`Net: ${money(toMajor(summary.netMinor))}`);
  doc.text(`Discount amount: ${money(toMajor(summary.discountMinor))}`);
  doc.text(`Discount %: ${summary.discountPct.toFixed(2)}%`);
  doc.text(`Margin %: ${summary.marginPct.toFixed(2)}%`);

  doc.moveDown(1).fontSize(13).text("Pipeline Funnel");
  doc.moveDown(0.3).fontSize(11);
  for (const stage of data.funnel) {
    doc.text(
      `${stage.status.padEnd(20)} ${String(stage.count).padStart(5)}   ${money(
        toMajor(stage.netMinor),
      )}`,
    );
  }

  doc.end();
}
