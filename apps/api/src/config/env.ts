import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("1d"),
  PORTAL_JWT_SECRET: z
    .string()
    .min(16)
    .default("dealflow360-portal-cryptographic-token-signing-secret"),
  PORTAL_TOKEN_TTL: z.string().default("14d"),
  DATABASE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
