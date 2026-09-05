import type { Product } from "../schemas/product";
import type { Quotation } from "../schemas/quotation";
import {
  SEED_UPSELL_RULES,
  type UpsellRule,
  type UpsellSuggestionItem,
} from "../schemas/upsell";

export const RANK_WEIGHTS = {
  coPurchase: 1.0,
  margin: 0.5,
  promoBoost: 0.25,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateUpsellSuggestions(
  quotation: Quotation,
  allProducts: Product[],
  rules: UpsellRule[] = SEED_UPSELL_RULES,
): UpsellSuggestionItem[] {
  if (!quotation.lines || quotation.lines.length === 0) {
    return [];
  }

  const inCart = new Set(quotation.lines.map((l) => l.productId));

  // Find candidate rules triggered by products currently in cart, omitting already purchased items
  const matchedRules = rules.filter(
    (r) => inCart.has(r.productId) && !inCart.has(r.suggestedId),
  );

  // Deduplicate by suggestedId, selecting the highest affinity rule
  const bySuggestedId = new Map<string, UpsellRule>();
  for (const rule of matchedRules) {
    const existing = bySuggestedId.get(rule.suggestedId);
    if (!existing || rule.coPurchaseScore > existing.coPurchaseScore) {
      bySuggestedId.set(rule.suggestedId, rule);
    }
  }

  // Calculate current baseline order revenue and cost
  let currentNetRevenueMinor = 0;
  let currentCostMinor = 0;

  for (const line of quotation.lines) {
    const listMinor = line.qty * line.unitPriceMinor;
    const discountFactor = 1 - (line.discountPct ?? 0) / 100;
    const lineNet = Math.round(listMinor * discountFactor);
    currentNetRevenueMinor += lineNet;
    currentCostMinor += line.qty * line.unitCostMinor;
  }

  const currentOrderMarginPct =
    currentNetRevenueMinor > 0
      ? ((currentNetRevenueMinor - currentCostMinor) / currentNetRevenueMinor) *
        100
      : 0;

  const productMap = new Map<string, Product>(
    allProducts.map((p) => [p.id, p]),
  );

  const candidates: UpsellSuggestionItem[] = [];

  for (const [suggestedId, rule] of bySuggestedId.entries()) {
    const product = productMap.get(suggestedId);
    if (!product) continue;

    const suggestedNetMinor = product.basePrice;
    const suggestedCostMinor = product.unitCost;

    const suggestionMarginPct =
      suggestedNetMinor > 0
        ? ((suggestedNetMinor - suggestedCostMinor) / suggestedNetMinor) * 100
        : 0;

    const newNetRevenueMinor = currentNetRevenueMinor + suggestedNetMinor;
    const newCostMinor = currentCostMinor + suggestedCostMinor;

    const resultingOrderMarginPct =
      newNetRevenueMinor > 0
        ? ((newNetRevenueMinor - newCostMinor) / newNetRevenueMinor) * 100
        : 0;

    // Guardrail Check: Drop suggestion if resulting order margin falls below rule minimum
    if (resultingOrderMarginPct < rule.minMarginPct) {
      continue;
    }

    const marginDeltaPct = round2(
      resultingOrderMarginPct - currentOrderMarginPct,
    );

    const score = round2(
      rule.coPurchaseScore * RANK_WEIGHTS.coPurchase +
        (product.isPromoted ? RANK_WEIGHTS.promoBoost : 0) +
        (suggestionMarginPct / 100) * RANK_WEIGHTS.margin,
    );

    candidates.push({
      product,
      marginDeltaPct,
      resultingOrderMarginPct: round2(resultingOrderMarginPct),
      promoted: product.isPromoted,
      coPurchaseScore: rule.coPurchaseScore,
      suggestionMarginPct: round2(suggestionMarginPct),
      score,
    });
  }

  // Sort candidates by highest score first
  return candidates.sort((a, b) => b.score - a.score);
}
