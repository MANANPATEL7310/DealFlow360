import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";
import { httpStatus } from "../constants/http.js";

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(httpStatus.badRequest).json({
      message: "Validation error.",
      issues: error.flatten(),
    });
  }

  logger.error({ error, method: req.method, url: req.originalUrl });

  return res.status(httpStatus.internalServerError).json({
    message: "Internal server error.",
  });
}
