import type { Request, Response } from "express";
import { buildReportDataset, type Viewer } from "./report-dataset.js";
import { reportFiltersSchema } from "./reports.schema.js";
import { writePdf } from "./export.pdf.js";
import { writeXlsx } from "./export.xlsx.js";

export async function exportXlsx(req: Request, res: Response): Promise<void> {
  const filters = reportFiltersSchema.parse(req.query);
  const viewer: Viewer = {
    sub: req.user?.sub ?? "usr-admin-01",
    role: req.user?.role ?? "admin",
    email: req.user?.email,
  };

  const data = await buildReportDataset(filters, viewer);

  try {
    await writeXlsx(res, data, filters);
  } catch (err) {
    if (!res.headersSent) {
      throw err;
    }
    res.destroy(err as Error);
  }
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const filters = reportFiltersSchema.parse(req.query);
  const viewer: Viewer = {
    sub: req.user?.sub ?? "usr-admin-01",
    role: req.user?.role ?? "admin",
    email: req.user?.email,
  };

  const data = await buildReportDataset(filters, viewer);

  try {
    writePdf(res, data, filters);
  } catch (err) {
    if (!res.headersSent) {
      throw err;
    }
    res.destroy(err as Error);
  }
}
