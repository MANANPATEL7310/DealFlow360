// apps/api/src/middleware/require-portal-auth.ts
import type { NextFunction, Request, Response } from "express";
import { httpStatus } from "../constants/http.js";
import { verifyPortalToken } from "../modules/portal/portal.token.js";

/**
 * Portal tokens are minted per quotation when a rep sends it to a customer.
 * They are scoped to ONE quotation — a customer can never reach internal routes,
 * and internal tokens cannot access portal routes.
 */
export function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Accept token from Authorization header OR ?token= OR ?t= query param
  const header = req.headers.authorization ?? "";
  const token =
    (header.startsWith("Bearer ") ? header.slice(7) : null) ??
    (req.query.token as string | undefined) ??
    (req.query.t as string | undefined);

  if (!token) {
    return res.status(httpStatus.unauthorized).json({
      success: false,
      code: "PORTAL_UNAUTHORIZED",
      message: "Missing portal token.",
    });
  }

  try {
    req.portal = verifyPortalToken(token);
    return next();
  } catch (err: unknown) {
    const isExpired = (err as Error)?.name === "TokenExpiredError";
    return res.status(httpStatus.unauthorized).json({
      success: false,
      code: isExpired ? "PORTAL_TOKEN_EXPIRED" : "PORTAL_UNAUTHORIZED",
      message: isExpired ? "Portal link has expired." : "Invalid portal link.",
    });
  }
}
