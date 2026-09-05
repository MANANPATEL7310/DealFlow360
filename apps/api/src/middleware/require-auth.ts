// apps/api/src/middleware/require-auth.ts
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { httpStatus } from "../constants/http.js";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "sales_rep" | "sales_manager" | "finance" | "admin";
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(httpStatus.unauthorized).json({
      success: false,
      message: "Missing bearer token.",
    });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return res.status(httpStatus.unauthorized).json({
      success: false,
      message: "Token is invalid or expired.",
    });
  }
}
