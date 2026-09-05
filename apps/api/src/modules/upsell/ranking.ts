// apps/api/src/modules/upsell/ranking.ts
// === M6: Pure upsell ranker (deterministic core — no I/O) ===
//
// The agent (Document B) may re-rank these later, but this must work standalone.
// Ranking = co-purchase affinity + promotion boost + margin contribution.
// PS A6 guardrail: drop any candidate whose resulting order margin < rule floor.

export type RankInput = {
  suggestedId: string;
  coPurchaseScore: number; // from UpsellRule
  isPromoted: boolean; // from Product.isPromoted
  suggestionMarginPct: number; // the suggested product's own margin at resolved price (0..100)
  minMarginPct: number; // rule guardrail — order margin floor
  resultingOrderMarginPct: number; // order margin IF this were added (0..100)
};

// Tunable weights (could move to SystemSetting later)
export const RANK_WEIGHTS = { coPurchase: 1.0, margin: 0.5, promoBoost: 0.25 };

/**
 * Rank upsell candidates by composite score, filtering out any whose
 * resulting order-margin would drop below the rule's floor.
 *
 * Pure function — unit-testable without a database.
 */
export function rankUpsells(
  cands: RankInput[],
): (RankInput & { score: number })[] {
  return (
    cands
      // PS A6 guardrail: suppress thin-margin suggestions
      .filter((c) => c.resultingOrderMarginPct >= c.minMarginPct)
      .map((c) => ({
        ...c,
        score:
          c.coPurchaseScore * RANK_WEIGHTS.coPurchase +
          (c.isPromoted ? RANK_WEIGHTS.promoBoost : 0) +
          (c.suggestionMarginPct / 100) * RANK_WEIGHTS.margin, // normalized margin
      }))
      .sort((a, b) => b.score - a.score)
  );
}
