import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { httpStatus } from "../constants/http.js";

export function validateRequest<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(httpStatus.badRequest).json({
        message: "Request validation failed.",
        issues: result.error.flatten(),
      });
    }

    req.body = result.data;
    return next();
  };
}
