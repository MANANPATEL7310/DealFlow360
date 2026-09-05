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
export type UserRole = InternalRole;
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
export const registerInputSchema = registerSchema;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().default(true), // frontend UX field — backend ignores it
});
export const loginInputSchema = loginSchema;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
});

export const authSessionSchema = z.object({
  token: z.string().optional(),
  accessToken: z.string().optional(),
  user: authUserSchema,
});

// ── Derived types ─────────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;

export interface DemoPersona {
  name: string;
  email: string;
  role: UserRole;
  title: string;
  tagline: string;
  avatarInitials: string;
  colorClass: string;
}

export const DEMO_PERSONAS: Record<UserRole, DemoPersona> = {
  sales_rep: {
    name: "Alex Miller",
    email: "alex.rep@dealflow360.com",
    role: "sales_rep",
    title: "Senior Sales Representative",
    tagline: "Builds customer quotations, seeks discount overrides",
    avatarInitials: "AM",
    colorClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  sales_manager: {
    name: "Sarah Chen",
    email: "sarah.mgr@dealflow360.com",
    role: "sales_manager",
    title: "Commercial Sales Manager",
    tagline: "Approves Tier 1 discounts (<15%), monitors rep velocity",
    avatarInitials: "SC",
    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  finance: {
    name: "Marcus Vance",
    email: "marcus.fin@dealflow360.com",
    role: "finance",
    title: "VP of Finance & Operations",
    tagline: "Approves Tier 2 discounts, enforces margin floors & credit",
    avatarInitials: "MV",
    colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  admin: {
    name: "Elena Rostova",
    email: "elena.adm@dealflow360.com",
    role: "admin",
    title: "Enterprise System Administrator",
    tagline: "Controls discount matrix, user roles, and audit configurations",
    avatarInitials: "ER",
    colorClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};
