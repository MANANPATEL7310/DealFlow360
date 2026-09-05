import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  // ── Existing ───────────────────────────────────────────────────────────────
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),

  // ── DealFlow360 core ───────────────────────────────────────────────────────
  DATABASE_URL: z.string().url(), // REQUIRED — app refuses to boot without it
  PORTAL_LINK_TTL: z.string().default("7d"), // customer magic-link lifetime

  // ── Phase 2 (AI) — optional so the app boots with AI off ──────────────────
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_APP_URL: z.string().url().default("http://localhost:5173"),
  AI_DEFAULT_MODEL: z.string().default("anthropic/claude-sonnet-4.5"),
  AI_EMBEDDING_MODEL: z.string().default("openai/text-embedding-3-small"),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(50),
});

export const env = envSchema.parse(process.env);
