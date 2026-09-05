// packages/shared/src/schemas/auth.ts
import { z } from "zod";

// ── Four internal roles (single source of truth) ──────────────────────────────
export const internalRoles = [
  "sales_rep",
  "sales_manager",
  "finance",
  "admin",
] as const;
export type InternalRole = (typeof internalRoles)[number];
export const roleSchema = z.enum(internalRoles);

// ── Auth schemas ──────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  name: z.string().min(1, "Name is required."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(64),
  role: roleSchema.optional(), // defaults to "sales_rep" in the service
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().default(true), // frontend UX field — backend ignores it
});

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
});

export const authSessionSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

// ── Derived types ─────────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;

// ── Keep loginInputSchema export for backward compatibility ───────────────────
/** @deprecated use loginSchema */
export const loginInputSchema = loginSchema;
