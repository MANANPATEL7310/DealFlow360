import type { Response } from "express";
import PDFDocument from "pdfkit";
import { reportFilename, toMajor } from "./export.util.js";
import type { ReportDataset, ReportFilters } from "./reports.schema.js";

const formatCurrency = (val: number): string =>
  `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function writePdf(
  res: Response,
  data: ReportDataset,
  filters: ReportFilters,
): void {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportFilename("pdf", filters)}"`,
  );

  const doc = new PDFDocument({ margin: 48, size: "A4" });
  doc.pipe(res);

  // ── Header & Branding ──────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text("DealFlow360 Executive Report", { align: "left" });

  doc.moveDown(0.2);

  const filterStrings: string[] = [
    `Period: ${filters.from ? new Date(filters.from).toISOString().slice(0, 10) : "All Time"} → ${filters.to ? new Date(filters.to).toISOString().slice(0, 10) : "Present"}`,
  ];
  if (data.filters.effectiveRepId) {
    filterStrings.push(`Scoped Rep: ${data.filters.effectiveRepId}`);
  }
  if (filters.status) {
    filterStrings.push(`Status: ${filters.status.replace(/_/g, " ")}`);
  }
  if (filters.category) {
    filterStrings.push(`Category: ${filters.category}`);
  }

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(filterStrings.join("  |  "));

  doc.moveDown(0.8);
  doc
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .moveTo(48, doc.y)
    .lineTo(547, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // ── Executive Financial Summary ────────────────────────────────────────────
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text("Financial Key Performance Indicators (KPIs)");

  doc.moveDown(0.4);

  const s = data.summary;
  const kpis: [string, string][] = [
    ["Total Monitored Quotations", String(s.quoteCount)],
    ["Gross Pipeline Value", formatCurrency(toMajor(s.grossMinor))],
    ["Net Booked / Active Value", formatCurrency(toMajor(s.netMinor))],
    ["Total Product Cost", formatCurrency(toMajor(s.costMinor))],
    ["Total Concessions (Discounts)", formatCurrency(toMajor(s.discountMinor))],
    ["Weighted Average Discount", `${s.discountPct.toFixed(2)}%`],
    ["Aggregate Realized Margin", `${s.marginPct.toFixed(2)}%`],
  ];

  doc.fontSize(10).font("Helvetica");
  for (const [label, value] of kpis) {
    const yPos = doc.y;
    doc.fillColor("#475569").text(label, 48, yPos);
    doc
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(value, 360, yPos, { align: "right", width: 187 });
    doc.font("Helvetica");
    doc.moveDown(0.3);
  }

  doc.moveDown(1);
  doc
    .strokeColor("#e2e8f0")
    .lineWidth(1)
    .moveTo(48, doc.y)
    .lineTo(547, doc.y)
    .stroke();
  doc.moveDown(0.8);

  // ── Pipeline Lifecycle Funnel ──────────────────────────────────────────────
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text("Pipeline Velocity & Stage Distribution");

  doc.moveDown(0.4);

  // Table header
  const tableHeaderY = doc.y;
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
  doc.text("STAGE", 48, tableHeaderY);
  doc.text("DEALS", 300, tableHeaderY, { align: "center", width: 60 });
  doc.text("NET VOLUME ($)", 400, tableHeaderY, { align: "right", width: 147 });

  doc.moveDown(0.3);
  doc
    .strokeColor("#cbd5e1")
    .lineWidth(0.5)
    .moveTo(48, doc.y)
    .lineTo(547, doc.y)
    .stroke();
  doc.moveDown(0.3);

  doc.fontSize(9).font("Helvetica");
  for (const item of data.funnel) {
    const rowY = doc.y;
    doc.fillColor("#1e293b").text(item.status.replace(/_/g, " "), 48, rowY);
    doc
      .fillColor("#475569")
      .text(String(item.count), 300, rowY, { align: "center", width: 60 });
    doc
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text(formatCurrency(toMajor(item.netMinor)), 400, rowY, {
        align: "right",
        width: 147,
      });
    doc.font("Helvetica");
    doc.moveDown(0.3);
  }

  // ── Category Contribution ──────────────────────────────────────────────────
  if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
    doc.moveDown(1);
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(48, doc.y)
      .lineTo(547, doc.y)
      .stroke();
    doc.moveDown(0.8);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#0f172a")
      .text("Product Category Contribution");

    doc.moveDown(0.4);

    const catHeaderY = doc.y;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b");
    doc.text("CATEGORY", 48, catHeaderY);
    doc.text("LINES", 240, catHeaderY, { align: "center", width: 50 });
    doc.text("NET VALUE ($)", 320, catHeaderY, { align: "right", width: 110 });
    doc.text("MARGIN %", 460, catHeaderY, { align: "right", width: 87 });

    doc.moveDown(0.3);
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(0.5)
      .moveTo(48, doc.y)
      .lineTo(547, doc.y)
      .stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font("Helvetica");
    for (const cat of data.categoryBreakdown) {
      const rowY = doc.y;
      doc.fillColor("#1e293b").text(cat.categoryName, 48, rowY);
      doc
        .fillColor("#475569")
        .text(String(cat.lineCount), 240, rowY, { align: "center", width: 50 });
      doc
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text(formatCurrency(toMajor(cat.netMinor)), 320, rowY, {
          align: "right",
          width: 110,
        });
      doc
        .font("Helvetica")
        .fillColor("#047857")
        .text(`${cat.marginPct.toFixed(1)}%`, 460, rowY, {
          align: "right",
          width: 87,
        });
      doc.moveDown(0.3);
    }
  }

  // Footer note
  doc
    .fontSize(8)
    .font("Helvetica-Oblique")
    .fillColor("#94a3b8")
    .text(
      "Generated autonomously by DealFlow360 Executive Intelligence Engine. All figures derived deterministically from line-level totals.",
      48,
      760,
      { align: "center", width: 499 },
    );

  doc.end();
}
