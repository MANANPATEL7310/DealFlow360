import type { Request, Response } from "express";
import {
  AcknowledgeAlertInputSchema,
  DealAnomalyTypeSchema,
  DealHealthSeveritySchema,
  DealHealthStatusSchema,
  ResolveAlertInputSchema,
} from "@template/shared";
import { sendError, sendOk } from "../../lib/response.js";
import { dealHealthService } from "./deal-health.service.js";

export function getDealHealthSummaryController(_req: Request, res: Response) {
  try {
    const summary = dealHealthService.getSummary();
    const scores = dealHealthService.getHealthScores();
    return sendOk(res, { summary, scores });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load deal health summary.";
    return sendError(res, 500, msg);
  }
}

export function getDealHealthAlertsController(req: Request, res: Response) {
  try {
    const { status, severity, type, quotationId } = req.query;

    const parsedStatus = status
      ? DealHealthStatusSchema.safeParse(status).data
      : undefined;
    const parsedSeverity = severity
      ? DealHealthSeveritySchema.safeParse(severity).data
      : undefined;
    const parsedType = type
      ? DealAnomalyTypeSchema.safeParse(type).data
      : undefined;

    const alerts = dealHealthService.getAlerts({
      status: parsedStatus,
      severity: parsedSeverity,
      type: parsedType,
      quotationId: typeof quotationId === "string" ? quotationId : undefined,
    });

    return sendOk(res, alerts);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to list deal health alerts.";
    return sendError(res, 500, msg);
  }
}

export function triggerDetectionScanController(_req: Request, res: Response) {
  try {
    const scanResult = dealHealthService.runDetectionScan();
    return sendOk(
      res,
      scanResult,
      `Autonomous scan complete. Detected ${scanResult.alerts.filter((a) => a.status === "open").length} open anomalies.`,
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Anomaly detection scan failed.";
    return sendError(res, 500, msg);
  }
}

export function acknowledgeAlertController(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return sendError(res, 400, "Alert ID parameter is required.");
    }

    const parsed = AcknowledgeAlertInputSchema.safeParse(req.body);
    const note = parsed.success ? parsed.data.note : undefined;
    const userId = req.user?.sub ?? "usr-sales-op";

    const alert = dealHealthService.acknowledgeAlert(id, note, userId);
    return sendOk(res, alert, "Alert acknowledged successfully.");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to acknowledge alert.";
    return sendError(res, 400, msg);
  }
}

export function resolveAlertController(req: Request, res: Response) {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return sendError(res, 400, "Alert ID parameter is required.");
    }

    const parsed = ResolveAlertInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid resolution input.");
    }

    const { resolutionNote, actionTaken } = parsed.data;
    const userId = req.user?.sub ?? "usr-sales-op";

    const alert = dealHealthService.resolveAlert(id, resolutionNote, actionTaken, userId);
    return sendOk(res, alert, "Alert resolved successfully.");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to resolve alert.";
    return sendError(res, 400, msg);
  }
}
