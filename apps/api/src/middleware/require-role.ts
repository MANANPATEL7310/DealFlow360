// apps/api/src/middleware/require-role.ts
import type { NextFunction, Request, Response } from "express";
import { httpStatus } from "../constants/http.js";

type InternalRole = "sales_rep" | "sales_manager" | "finance" | "admin";

/**
 * requireRole(...roles) — gates a route to users with one of the specified roles.
 *
 * Usage:
 *   router.post("/", requireAuth, requireRole("sales_rep"), handler)
 *   router.use(requireAuth, requireRole("admin"))  // all routes in scope
 */
export function requireRole(...roles: InternalRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as InternalRole)) {
      return res.status(httpStatus.forbidden).json({
        success: false,
        message: "Forbidden.",
      });
    }
    return next();
  };
}
