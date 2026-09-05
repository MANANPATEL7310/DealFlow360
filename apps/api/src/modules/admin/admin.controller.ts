import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendError, sendOk } from "../../lib/response.js";
import { auditLogQuerySchema, updateSettingInputSchema } from "./admin.schema.js";
import { adminService } from "./admin.service.js";

export async function listSettingsController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const settings = adminService.listSettings();
    sendOk(res, settings);
  } catch (error: unknown) {
    sendError(
      res,
      httpStatus.internalServerError,
      (error as Error).message || "Failed to list settings.",
    );
  }
}

export async function updateSettingController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const key = decodeURIComponent(req.params.key as string);
    const parsed = updateSettingInputSchema.parse(req.body);
    const actorId = req.user?.sub;
    const actorName = req.user?.name;

    const updated = await adminService.updateSetting(
      key,
      parsed.value,
      actorId,
      actorName,
    );
    sendOk(res, updated, `Setting "${key}" updated successfully.`);
  } catch (error: unknown) {
    sendError(
      res,
      httpStatus.badRequest,
      (error as Error).message || "Failed to update setting.",
    );
  }
}

export async function listAuditLogsController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const query = auditLogQuerySchema.parse(req.query);
    const result = adminService.listAuditLogs(query);
    sendOk(res, result);
  } catch (error: unknown) {
    sendError(
      res,
      httpStatus.badRequest,
      (error as Error).message || "Failed to query audit logs.",
    );
  }
}
