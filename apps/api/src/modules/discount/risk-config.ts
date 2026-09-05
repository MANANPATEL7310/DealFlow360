// apps/api/src/modules/discount/risk-config.ts
import { db } from "../../lib/db.js";
import type { RiskConfig } from "./risk-engine.js";

// Defaults mirror seed — used if a SystemSetting row is missing
const SETTING_DEFAULTS = {
  "risk.perLineTolerancePct": 5,
  "risk.blendedThreshold": 3,
  "risk.financeValueThresholdMinor": 500000,
} as const;

async function numberSetting(
  key: keyof typeof SETTING_DEFAULTS,
): Promise<number> {
  const row = await db.systemSetting.findUnique({ where: { key } });
  if (!row) return SETTING_DEFAULTS[key];
  try {
    return Number(JSON.parse(row.value));
  } catch {
    return SETTING_DEFAULTS[key];
  }
}

export async function loadRiskConfig(
  customerTier: string,
): Promise<RiskConfig> {
  const [
    tier,
    ceilings,
    perLineTolerancePct,
    blendedThreshold,
    financeValueThresholdMinor,
  ] = await Promise.all([
    db.discountTier.findUnique({
      where: { customerTier: customerTier as never },
    }),
    db.categoryCeiling.findMany(),
    numberSetting("risk.perLineTolerancePct"),
    numberSetting("risk.blendedThreshold"),
    numberSetting("risk.financeValueThresholdMinor"),
  ]);

  const categoryCeilingPct: Record<string, number> = {};
  for (const c of ceilings) {
    categoryCeilingPct[c.category] = c.maxDiscountPct;
  }

  return {
    // fail-safe: no tier row → 0 headroom, so ANY discount flags for review
    tierCeilingPct: tier?.maxDiscountPct ?? 0,
    categoryCeilingPct,
    perLineTolerancePct,
    blendedThreshold,
    financeValueThresholdMinor,
  };
}
