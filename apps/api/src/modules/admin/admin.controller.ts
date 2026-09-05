import type { Request, Response } from "express";
import { sendOk } from "../../lib/response.js";
import { auditLogQuerySchema } from "./admin.schema.js";
import {
  getAiUsageSummary,
  listAuditLogs,
  listSettings,
  updateSetting,
} from "./admin.service.js";

export async function listSettingsController(_req: Request, res: Response) {
  return sendOk(res, await listSettings());
}

export async function updateSettingController(req: Request, res: Response) {
  if (!req.params.key) {
    throw Object.assign(new Error("SETTING_KEY_REQUIRED"), { http: 400 });
  }

  const rawKey = Array.isArray(req.params.key)
    ? req.params.key[0]
    : req.params.key;
  if (!rawKey) {
    throw Object.assign(new Error("SETTING_KEY_REQUIRED"), { http: 400 });
  }

  const key = decodeURIComponent(rawKey);
  const setting = await updateSetting(key, req.body.value, req.user!.sub);

  return sendOk(res, setting, "Setting updated.");
}

export async function listAuditLogsController(req: Request, res: Response) {
  const filters = auditLogQuerySchema.parse(req.query);

  return sendOk(res, await listAuditLogs(filters));
}

export async function aiUsageSummaryController(_req: Request, res: Response) {
  return sendOk(res, await getAiUsageSummary());
}
