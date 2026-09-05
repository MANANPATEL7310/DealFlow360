import { db } from "./db.js";

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
  const row = await client.systemSetting.findUnique({ where: { key } });
  if (!row) {
    return fallback;
  }

  return parseSetting(row.value, fallback);
}
