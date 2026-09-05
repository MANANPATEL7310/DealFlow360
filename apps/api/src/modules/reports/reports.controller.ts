import type { Request, Response } from "express";
import { sendError, sendOk } from "../../lib/response.js";
import { buildReportDataset, type Viewer } from "./report-dataset.js";
import { reportFiltersSchema } from "./reports.schema.js";

export async function salesReport(req: Request, res: Response): Promise<void> {
  try {
    const filters = reportFiltersSchema.parse(req.query);
    const viewer: Viewer = {
      sub: req.user?.sub ?? "usr-admin-01",
      role: req.user?.role ?? "admin",
      email: req.user?.email,
    };

    const dataset = await buildReportDataset(filters, viewer);
    sendOk(res, dataset);
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to compute sales report.";
    sendError(res, 500, msg);
  }
}
