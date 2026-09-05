import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { httpStatus } from "../constants/http.js";

type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: "admin" | "member";
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return res.status(httpStatus.unauthorized).json({
      message: "Missing bearer token.",
    });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    return next();
  } catch {
    return res.status(httpStatus.unauthorized).json({
      message: "Token is invalid or expired.",
    });
  }
}
