// apps/api/src/modules/upsell/ranking.test.ts
import { describe, expect, it } from "vitest";
import { rankUpsells, type RankInput, RANK_WEIGHTS } from "./ranking.js";

describe("rankUpsells — pure upsell ranking & margin guardrails", () => {
  it("drops candidates whose resulting order margin is below the minimum margin floor", () => {
    const candidates: RankInput[] = [
      {
        suggestedId: "prod-ok",
        coPurchaseScore: 0.8,
        isPromoted: false,
        suggestionMarginPct: 30,
        minMarginPct: 15,
        resultingOrderMarginPct: 20, // 20 >= 15 -> KEEP
      },
      {
        suggestedId: "prod-dropped",
        coPurchaseScore: 0.95,
        isPromoted: true,
        suggestionMarginPct: 10,
        minMarginPct: 25,
        resultingOrderMarginPct: 18, // 18 < 25 -> DROP
      },
    ];

    const results = rankUpsells(candidates);
    expect(results).toHaveLength(1);
    expect(results[0]!.suggestedId).toBe("prod-ok");
  });

  it("calculates composite score correctly based on weights", () => {
    const candidate: RankInput = {
      suggestedId: "prod-1",
      coPurchaseScore: 0.8,
      isPromoted: true,
      suggestionMarginPct: 40, // 40% margin -> 0.40 * 0.5 = 0.20
      minMarginPct: 10,
      resultingOrderMarginPct: 25,
    };

    const expectedScore =
      0.8 * RANK_WEIGHTS.coPurchase +
      RANK_WEIGHTS.promoBoost +
      (40 / 100) * RANK_WEIGHTS.margin; // 0.8*1.0 + 0.25 + 0.4*0.5 = 0.8 + 0.25 + 0.2 = 1.25

    const results = rankUpsells([candidate]);
    expect(results[0]!.score).toBeCloseTo(expectedScore, 5);
  });

  it("sorts candidates in descending order of composite score", () => {
    const candidates: RankInput[] = [
      {
        suggestedId: "lower-score",
        coPurchaseScore: 0.3,
        isPromoted: false,
        suggestionMarginPct: 20,
        minMarginPct: 5,
        resultingOrderMarginPct: 15,
      },
      {
        suggestedId: "higher-score",
        coPurchaseScore: 0.9,
        isPromoted: true,
        suggestionMarginPct: 50,
        minMarginPct: 5,
        resultingOrderMarginPct: 20,
      },
    ];

    const results = rankUpsells(candidates);
    expect(results).toHaveLength(2);
    expect(results[0]!.suggestedId).toBe("higher-score");
    expect(results[1]!.suggestedId).toBe("lower-score");
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });
});
