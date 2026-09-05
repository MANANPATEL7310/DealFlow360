import { db } from "../../lib/db.js";
import type { HealthConfig } from "./detection.js";

async function loadSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.systemSetting.findUnique({ where: { key } });
  if (!row) {
    return fallback;
  }

  return JSON.parse(row.value) as T;
}

export async function loadHealthConfig(): Promise<HealthConfig> {
  const [stalledDays, anomalyK, minBaselineSample] = await Promise.all([
    loadSetting("health.stalledDays", 7),
    loadSetting("health.anomalyK", 2),
    loadSetting("health.minBaselineSample", 5),
  ]);

  return { stalledDays, anomalyK, minBaselineSample };
}
