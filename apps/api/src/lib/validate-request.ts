// apps/api/src/lib/validate-request.ts
import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { httpStatus } from "../constants/http.js";

/**
 * Validates req.body against the given Zod schema.
 * On failure returns the standard envelope: { success: false, message, issues }
 * On success replaces req.body with the parsed (coerced/typed) data.
 */
export function validateRequest<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(httpStatus.badRequest).json({
        success: false,
        message: "Request validation failed.",
        issues: result.error.flatten(),
      });
    }

    req.body = result.data;
    return next();
  };
}
