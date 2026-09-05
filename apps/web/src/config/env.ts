import { z } from "zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default("DealFlow360"),
  VITE_API_URL: z.string().url().default("http://localhost:4000/api/v1"),
});

export const env = envSchema.parse(import.meta.env);
