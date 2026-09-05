import { z } from "zod";

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1),
  VITE_API_URL: z.string().url(),
});

export const env = envSchema.parse(import.meta.env);
