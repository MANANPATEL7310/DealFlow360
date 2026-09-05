/* eslint-disable @typescript-eslint/no-namespace */
import type { NextFunction, Request, Response } from "express";
import { httpStatus } from "../constants/http.js";
import { sendError } from "../lib/response.js";
import { verifyPortalToken, type PortalClaims } from "../modules/portal/portal.token.js";

declare global {
  namespace Express {
    interface Request {
      portal?: PortalClaims;
    }
  }
}

export function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, httpStatus.unauthorized, "Missing or malformed portal authorization token.");
    return;
  }

  const token = authHeader.slice(7).trim();

  try {
    const claims = verifyPortalToken(token);
    req.portal = claims;
    next();
  } catch (error: unknown) {
    const isExpired =
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "TokenExpiredError";

    sendError(
      res,
      httpStatus.unauthorized,
      isExpired
        ? "Portal magic link has expired. Please request a new link from your sales representative."
        : "Invalid or unauthorized customer portal token.",
    );
  }
}
