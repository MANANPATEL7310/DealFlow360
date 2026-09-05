import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { LoginInput } from "./auth.schema.js";

export function loginService(payload: LoginInput) {
  const user = {
    id: "usr-template-admin",
    name: payload.email.includes("admin") ? "Admin Builder" : "Product Builder",
    email: payload.email,
    role: payload.email.includes("admin")
      ? ("admin" as const)
      : ("member" as const),
  };

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as unknown as number,
    },
  );

  return {
    accessToken,
    user,
  };
}
