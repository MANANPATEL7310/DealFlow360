/**
 * Shared helper for the real agent controllers. Certain errors are not true
 * server faults — they mean the agent simply can't run right now (budget
 * exhausted, no active prompt version seeded, or the AI provider is down).
 * In those cases the correct behavior is to degrade gracefully so the UI can
 * hide/soften the AI surface, rather than surface a 500.
 */
export function isDegradableAiError(error: unknown): {
  degrade: boolean;
  reason?: string;
} {
  const err = error as
    | { message?: string; http?: number; code?: string }
    | undefined;
  const message = err?.message ?? "";

  if (message === "AI_BUDGET_EXCEEDED" || err?.http === 402) {
    return { degrade: true, reason: "AI_BUDGET_EXCEEDED" };
  }
  if (message.startsWith("NO_ACTIVE_PROMPT")) {
    return { degrade: true, reason: "NO_ACTIVE_PROMPT" };
  }
  // Upstream provider / network failures from the LLM call.
  if (
    message === "NO_COMPLETION_CHOICE" ||
    message === "MALFORMED_JSON" ||
    message === "AGENT_MAX_STEPS" ||
    message === "AI_EMBEDDING_EMPTY"
  ) {
    return { degrade: true, reason: message };
  }

  return { degrade: false };
}
