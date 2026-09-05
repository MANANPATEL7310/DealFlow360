import OpenAI from "openai";
import { env } from "../config/env.js";

export const llm = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY || "disabled",
  baseURL: env.OPENROUTER_BASE_URL,
  defaultHeaders: {
    "HTTP-Referer": env.OPENROUTER_APP_URL,
    "X-OpenRouter-Title": "DealFlow360",
  },
});

export function aiEnabled() {
  return Boolean(env.OPENROUTER_API_KEY);
}
