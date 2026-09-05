// apps/api/src/modules/discount/risk-engine.test.ts
import { describe, expect, it } from "vitest";
import { computeBlendedRisk, type RiskConfig } from "./risk-engine.js";
import { resolveRequiredLevels } from "./routing.service.js";

// Gold tier, seeded ceilings + seeded thresholds (see seed.ts)
const cfg: RiskConfig = {
  tierCeilingPct: 15,
  categoryCeilingPct: { HARDWARE: 15, SERVICES: 10, SUBSCRIPTIONS: 12 },
  perLineTolerancePct: 5,
  blendedThreshold: 3,
  financeValueThresholdMinor: 500000,
};

// Seeded ApprovalChainRule set
const chain = [
  { minScore: 0.01, maxScore: 3, requiredLevels: ["SALES_MANAGER"] }, // "small overage"
  {
    minScore: 3,
    maxScore: null,
    requiredLevels: ["SALES_MANAGER", "FINANCE"],
  }, // "high risk"
];

describe("M4: Blended Risk Engine", () => {
  it("auto-approves when every line is within its effective ceiling", () => {
    const lines = [
      {
        category: "HARDWARE",
        appliedDiscountPct: 12,
        lineSubtotalMinor: 100000,
      }, // ceil 15 → 0 over
      {
        category: "SERVICES",
        appliedDiscountPct: 10,
        lineSubtotalMinor: 20000,
      }, // ceil 10 → 0 over
    ];
    const risk = computeBlendedRisk(lines, cfg);
    expect(risk.worstLineViolationPct).toBe(0);
    expect(risk.blendedScore).toBe(0);
    expect(resolveRequiredLevels(risk, cfg, chain)).toEqual([]);
  });

  it("routes a small single overage to Sales Manager only", () => {
    const lines = [
      {
        category: "HARDWARE",
        appliedDiscountPct: 17,
        lineSubtotalMinor: 100000,
      }, // ceil 15 → 2 over
    ];
    const risk = computeBlendedRisk(lines, cfg);
    expect(risk.worstLineViolationPct).toBe(2); // < perLineTolerancePct (5)
    expect(risk.blendedScore).toBe(2); // weight 1.0 → 2 × 1 = 2  (< blendedThreshold 3)
    expect(risk.discountedValueMinor).toBe(17000); // round(100000 × 0.17)   (< 500000)
    expect(resolveRequiredLevels(risk, cfg, chain)).toEqual(["SALES_MANAGER"]);
  });

  it("escalates a large single overage past per-line tolerance to Finance", () => {
    const lines = [
      {
        category: "HARDWARE",
        appliedDiscountPct: 12,
        lineSubtotalMinor: 100000,
      }, // ceil 15 → 0 over
      {
        category: "SERVICES",
        appliedDiscountPct: 18,
        lineSubtotalMinor: 20000,
      }, // ceil min(15,10)=10 → 8 over
    ];
    const risk = computeBlendedRisk(lines, cfg);
    expect(risk.worstLineViolationPct).toBe(8); // > perLineTolerancePct (5) → hard escalation
    expect(risk.blendedScore).toBe(1.33); // 8 × (20000/120000)=1.3333 → round2 → 1.33
    expect(risk.discountedValueMinor).toBe(15600); // 12000 + 3600
    expect(resolveRequiredLevels(risk, cfg, chain)).toEqual([
      "SALES_MANAGER",
      "FINANCE",
    ]);
  });

  it("catches distributed risk via the blended score even when every line is individually tolerable", () => {
    const lines = [
      {
        category: "SERVICES",
        appliedDiscountPct: 14,
        lineSubtotalMinor: 100000,
      }, // ceil 10 → 4 over
      {
        category: "SERVICES",
        appliedDiscountPct: 14,
        lineSubtotalMinor: 100000,
      }, // 4 over
      {
        category: "SERVICES",
        appliedDiscountPct: 14,
        lineSubtotalMinor: 100000,
      }, // 4 over
      {
        category: "SERVICES",
        appliedDiscountPct: 14,
        lineSubtotalMinor: 100000,
      }, // 4 over
    ];
    const risk = computeBlendedRisk(lines, cfg);
    expect(risk.worstLineViolationPct).toBe(4); // every line under tolerance (5)
    expect(risk.blendedScore).toBe(4); // 4 × (4 × 0.25) = 4  (> blendedThreshold 3)
    expect(resolveRequiredLevels(risk, cfg, chain)).toEqual([
      "SALES_MANAGER",
      "FINANCE",
    ]);
  });

  it("uses min(tierCeiling, categoryCeiling) as the effective ceiling", () => {
    const lines = [
      {
        category: "SERVICES",
        appliedDiscountPct: 11,
        lineSubtotalMinor: 50000,
      },
    ];
    const { breakdown } = computeBlendedRisk(lines, cfg); // tier 15, SERVICES 10 → effective 10
    expect(breakdown[0]!.effectiveCeilingPct).toBe(10);
    expect(breakdown[0]!.violationPct).toBe(1); // 11 − 10
  });

  it("escalates to Finance when discounted value exceeds the finance value threshold", () => {
    const lines = [
      {
        category: "HARDWARE",
        appliedDiscountPct: 16,
        lineSubtotalMinor: 10_000_000,
      }, // ceil 15 → 1 over
    ];
    const risk = computeBlendedRisk(lines, cfg);
    expect(risk.worstLineViolationPct).toBe(1); // under tolerance (5)
    expect(risk.discountedValueMinor).toBe(1_600_000); // round(10,000,000 × 0.16) > 500000
    expect(resolveRequiredLevels(risk, cfg, chain)).toEqual([
      "SALES_MANAGER",
      "FINANCE",
    ]);
  });
});
