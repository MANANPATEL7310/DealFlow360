// apps/api/src/modules/discount/risk.service.ts
import { loadApprovalRules } from "../governance/governance.service.js";
import { loadRiskConfig } from "./risk-config.js";
import { computeBlendedRisk, type RiskLine } from "./risk-engine.js";
import { resolveRequiredLevels } from "./routing.service.js";

export async function evaluateQuoteRisk(
  customerTier: string,
  lines: RiskLine[],
) {
  const [cfg, chain] = await Promise.all([
    loadRiskConfig(customerTier),
    loadApprovalRules(),
  ]);
  const risk = computeBlendedRisk(lines, cfg);
  const requiredLevels = resolveRequiredLevels(risk, cfg, chain);
  return { risk, requiredLevels, cfg };
}
