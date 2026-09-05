import type { Request, Response } from "express";
import { sendOk } from "../../lib/response.js";
import { buildReportDataset } from "./report-dataset.js";
import { reportFiltersSchema } from "./reports.schema.js";

export async function salesReportController(req: Request, res: Response) {
  const filters = reportFiltersSchema.parse(req.query);
  const dataset = await buildReportDataset(filters, req.user!);

  return sendOk(res, dataset);
}
