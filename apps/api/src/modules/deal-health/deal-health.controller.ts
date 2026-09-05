import type { Request, Response } from "express";
import { ZodError } from "zod";
import { httpStatus } from "../../constants/http.js";
import { sendError, sendOk } from "../../lib/response.js";
import { alertFiltersSchema } from "./deal-health.schema.js";
import {
  acknowledgeAlert,
  getHealthSummary,
  listAlerts,
  nudgeOrEscalate,
  resolveAlert,
  runDetection,
} from "./deal-health.service.js";

function handleError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    return res.status(httpStatus.badRequest).json({
      success: false,
      message: "Validation error.",
      issues: error.flatten(),
    });
  }

  const err = error as Error & { http?: number };
  if (err.http) {
    return sendError(res, err.http, err.message);
  }
  return sendError(
    res,
    httpStatus.internalServerError,
    err.message || "Internal server error.",
  );
}

export async function summaryController(_req: Request, res: Response) {
  try {
    return sendOk(res, await getHealthSummary());
  } catch (e) {
    return handleError(res, e);
  }
}

export async function listAlertsController(req: Request, res: Response) {
  try {
    const filters = alertFiltersSchema.parse(req.query);
    return sendOk(res, await listAlerts(filters));
  } catch (e) {
    return handleError(res, e);
  }
}

export async function detectController(_req: Request, res: Response) {
  try {
    return sendOk(res, await runDetection(), "Deal health detection complete.");
  } catch (e) {
    return handleError(res, e);
  }
}

export async function acknowledgeController(req: Request, res: Response) {
  try {
    return sendOk(
      res,
      await acknowledgeAlert(req.params.id as string),
      "Alert acknowledged.",
    );
  } catch (e) {
    return handleError(res, e);
  }
}

export async function resolveController(req: Request, res: Response) {
  try {
    return sendOk(
      res,
      await resolveAlert(req.params.id as string),
      "Alert resolved.",
    );
  } catch (e) {
    return handleError(res, e);
  }
}

export async function nudgeController(req: Request, res: Response) {
  try {
    return sendOk(
      res,
      await nudgeOrEscalate(req.params.id as string, req.user!.sub, req.body),
      "Alert action recorded.",
    );
  } catch (e) {
    return handleError(res, e);
  }
}
