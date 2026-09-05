// apps/api/src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db.js";
import { env } from "../../config/env.js";

// ── Register ──────────────────────────────────────────────────────────────────
export async function registerService(input: {
  email: string;
  name: string;
  password: string;
  role?: string;
}) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("EMAIL_TAKEN");

  const hashed = await bcrypt.hash(input.password, 10);
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: hashed,
      role: input.role ?? "sales_rep",
    },
  });

  return toSession(user);
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function loginService(input: { email: string; password: string }) {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user || !(await bcrypt.compare(input.password, user.password))) {
    throw new Error("BAD_CREDENTIALS");
  }
  return toSession(user);
}

// ── Token factory (shared by register + login) ────────────────────────────────
function toSession(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as unknown as number },
  );
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  };
}
