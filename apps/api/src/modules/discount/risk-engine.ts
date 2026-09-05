// apps/api/src/modules/discount/risk-engine.ts
export type RiskLine = {
  category: string; // "HARDWARE" | "SERVICES" | "SUBSCRIPTIONS" | ...
  appliedDiscountPct: number; // e.g. 18
  lineSubtotalMinor: number; // pre-discount, minor units
};

export type RiskConfig = {
  tierCeilingPct: number; // customer tier ceiling (Module 3)
  categoryCeilingPct: Record<string, number>; // per-category ceilings (Module 3)
  perLineTolerancePct: number; // SystemSetting: worst-line → Finance
  blendedThreshold: number; // SystemSetting: blended → Finance
  financeValueThresholdMinor: number; // SystemSetting: $ given away → Finance
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeBlendedRisk(lines: RiskLine[], cfg: RiskConfig) {
  const orderSubtotal = lines.reduce((s, l) => s + l.lineSubtotalMinor, 0) || 1;

  const breakdown = lines.map((l) => {
    // effective ceiling = the STRICTER of tier vs category
    const catCeil = cfg.categoryCeilingPct[l.category] ?? cfg.tierCeilingPct;
    const effectiveCeilingPct = Math.min(cfg.tierCeilingPct, catCeil);
    const violationPct = Math.max(
      0,
      l.appliedDiscountPct - effectiveCeilingPct,
    );
    const weight = l.lineSubtotalMinor / orderSubtotal; // value-weight the violation
    return {
      ...l,
      effectiveCeilingPct,
      violationPct,
      weightedViolation: violationPct * weight,
    };
  });

  const worstLineViolationPct = breakdown.reduce(
    (m, b) => Math.max(m, b.violationPct),
    0,
  );
  const blendedScore = round2(
    breakdown.reduce((s, b) => s + b.weightedViolation, 0),
  );
  const discountedValueMinor = lines.reduce(
    (s, l) =>
      s + Math.round(l.lineSubtotalMinor * (l.appliedDiscountPct / 100)),
    0,
  );

  return {
    blendedScore,
    worstLineViolationPct,
    discountedValueMinor,
    breakdown,
  };
}
