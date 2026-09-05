import { db } from "./db.js";
import { CANONICAL_SETTINGS, type SystemSetting } from "@template/shared";

// In-memory system settings registry
const settingsMap = new Map<string, SystemSetting>();

// Initialize canonical settings
for (const def of CANONICAL_SETTINGS) {
  settingsMap.set(def.key, {
    id: `set-${def.key.replace(/\./g, "-")}`,
    key: def.key,
    value: def.defaultValue,
    category: def.category,
    label: def.label,
    description: def.description,
    scope: "global",
    updatedAt: new Date().toISOString(),
  });
}

/** Load a single setting by key, returning fallback if not found. */
export async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  const row = settingsMap.get(key);
  return row ? (row.value as T) : fallback;
}

/** Load all system settings as a key -> value map. */
export async function loadAllSettings(): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const [key, setting] of settingsMap.entries()) {
    result[key] = setting.value;
  }
  return result;
}

export function getSettingsMap(): Map<string, SystemSetting> {
  return settingsMap;
}

type SettingsClient = {
  systemSetting: {
    findUnique: (args: {
      where: { key: string };
    }) => Promise<{ value: string } | null>;
  };
};

export function parseSetting<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getSetting<T>(
  key: string,
  fallback: T,
  client: SettingsClient = db as unknown as SettingsClient,
): Promise<T> {
  try {
    const row = await client.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return loadSetting(key, fallback);
    }
    return parseSetting(row.value, fallback);
  } catch {
    return loadSetting(key, fallback);
  }
}
