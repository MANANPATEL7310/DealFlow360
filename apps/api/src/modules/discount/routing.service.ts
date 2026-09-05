// apps/api/src/modules/discount/routing.service.ts
import type { computeBlendedRisk, RiskConfig } from "./risk-engine.js";

export function resolveRequiredLevels(
  risk: ReturnType<typeof computeBlendedRisk>,
  cfg: RiskConfig,
  chain: {
    minScore: number;
    maxScore: number | null;
    requiredLevels: string[];
  }[],
): ("SALES_MANAGER" | "FINANCE")[] {
  const needsApproval = risk.worstLineViolationPct > 0 || risk.blendedScore > 0;
  if (!needsApproval) return []; // AUTO-APPROVE

  // config-driven band match on blended score
  const band = chain
    .filter(
      (r) =>
        risk.blendedScore >= r.minScore &&
        (r.maxScore === null || risk.blendedScore < r.maxScore),
    )
    .sort((a, b) => b.minScore - a.minScore)[0];

  const levels = new Set<string>(band?.requiredLevels ?? ["SALES_MANAGER"]);

  // hard escalations to Finance regardless of band
  if (
    risk.worstLineViolationPct > cfg.perLineTolerancePct ||
    risk.blendedScore > cfg.blendedThreshold ||
    risk.discountedValueMinor > cfg.financeValueThresholdMinor
  ) {
    levels.add("SALES_MANAGER");
    levels.add("FINANCE");
  }

  // order matters: SM first, then Finance
  return (["SALES_MANAGER", "FINANCE"] as const).filter((l) => levels.has(l));
}
