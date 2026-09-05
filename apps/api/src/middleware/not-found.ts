import type { Request, Response } from "express";
import { httpStatus } from "../constants/http.js";

export function notFoundHandler(req: Request, res: Response) {
  return res.status(httpStatus.notFound).json({
    message: `Route ${req.originalUrl} was not found.`,
  });
}
