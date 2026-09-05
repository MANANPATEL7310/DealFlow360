import { getSetting } from "../lib/settings.js";
import { aiEnabled } from "./llm.js";

type FlagClient = Parameters<typeof getSetting<boolean>>[2];

export function hasAiKey() {
  return aiEnabled();
}

export async function aiAgentEnabled(
  agent: string,
  client?: FlagClient,
): Promise<boolean> {
  if (!hasAiKey()) {
    return false;
  }

  if (!(await getSetting<boolean>("ai.enabled", false, client))) {
    return false;
  }

  return getSetting<boolean>(`ai.${agent}.enabled`, true, client);
}
