import type { Response } from "express";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export function sendOk<T>(res: Response, data: T, message?: string) {
  return res
    .status(200)
    .json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message = "Created successfully",
) {
  return res
    .status(201)
    .json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function sendError(res: Response, status: number, message: string) {
  return res
    .status(status)
    .json({ success: false, message } satisfies ApiResponse<never>);
}

export function sendNotFound(res: Response, entity = "Resource") {
  return res.status(404).json({
    success: false,
    message: `${entity} not found.`,
  } satisfies ApiResponse<never>);
}
