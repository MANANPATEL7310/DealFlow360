// apps/api/src/modules/auth/auth.controller.ts
import type { Request, Response } from "express";
import { httpStatus } from "../../constants/http.js";
import { sendCreated, sendError, sendOk } from "../../lib/response.js";
import { loginService, registerService } from "./auth.service.js";

// ── POST /auth/register ───────────────────────────────────────────────────────
export async function registerController(req: Request, res: Response) {
  try {
    return sendCreated(
      res,
      await registerService(req.body),
      "Registered successfully.",
    );
  } catch (e) {
    if ((e as Error).message === "EMAIL_TAKEN") {
      return sendError(res, httpStatus.conflict, "Email already registered.");
    }
    throw e; // global error handler catches
  }
}

// ── POST /auth/login ──────────────────────────────────────────────────────────
export async function loginController(req: Request, res: Response) {
  try {
    return sendOk(res, await loginService(req.body), "Logged in.");
  } catch (e) {
    if ((e as Error).message === "BAD_CREDENTIALS") {
      return sendError(
        res,
        httpStatus.unauthorized,
        "Invalid email or password.",
      );
    }
    throw e;
  }
}

// ── GET /auth/me ──────────────────────────────────────────────────────────────
export async function meController(req: Request, res: Response) {
  // requireAuth middleware guarantees req.user is populated
  return sendOk(res, { user: req.user });
}
