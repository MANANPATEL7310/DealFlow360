// apps/api/src/middleware/require-portal-auth.ts
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { httpStatus } from "../constants/http.js";

/**
 * Portal tokens are minted per quotation when a rep sends it to a customer.
 * They are scoped to ONE quotation — a customer can never reach internal routes.
 */
type PortalToken = {
  kind: "portal";
  quotationId: string;
  contactId: string;
};

export function requirePortalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Accept token from Authorization header OR ?t= query param (magic link)
  const token =
    req.headers.authorization?.replace("Bearer ", "") ??
    (req.query.t as string | undefined);

  if (!token) {
    return res.status(httpStatus.unauthorized).json({
      success: false,
      message: "Missing portal token.",
    });
  }

  try {
    const p = jwt.verify(token, env.JWT_SECRET) as PortalToken;
    if (p.kind !== "portal") throw new Error("not a portal token");
    req.portal = { quotationId: p.quotationId, contactId: p.contactId };
    return next();
  } catch {
    return res.status(httpStatus.unauthorized).json({
      success: false,
      message: "Invalid or expired portal link.",
    });
  }
}
