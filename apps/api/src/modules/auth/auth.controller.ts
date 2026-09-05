import type { Request, Response } from "express";
import { sendOk } from "../../lib/response.js";
import type { LoginInput } from "./auth.schema.js";
import { loginService } from "./auth.service.js";

export function loginController(req: Request, res: Response) {
  const session = loginService(req.body as LoginInput);
  return sendOk(res, session);
}
