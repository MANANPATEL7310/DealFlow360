import type { Request, Response } from "express";
import { sendOk } from "../../lib/response.js";

export function healthController(_req: Request, res: Response) {
  return sendOk(res, {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
