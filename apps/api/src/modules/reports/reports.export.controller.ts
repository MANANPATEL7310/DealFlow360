import type { Request, Response } from "express";
import { buildReportDataset } from "./report-dataset.js";
import { writePdf } from "./export.pdf.js";
import { writeXlsx } from "./export.xlsx.js";
import { reportFiltersSchema } from "./reports.schema.js";

export async function exportXlsxController(req: Request, res: Response) {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await buildReportDataset(filters, req.user!);

  try {
    await writeXlsx(res, data, filters);
  } catch (error) {
    if (!res.headersSent) {
      throw error;
    }
    res.destroy(error as Error);
  }
}

export async function exportPdfController(req: Request, res: Response) {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await buildReportDataset(filters, req.user!);

  try {
    writePdf(res, data, filters);
  } catch (error) {
    if (!res.headersSent) {
      throw error;
    }
    res.destroy(error as Error);
  }
}
