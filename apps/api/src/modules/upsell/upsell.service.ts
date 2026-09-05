// apps/api/src/modules/upsell/upsell.service.ts
// === M6: Upsell & Cross-sell suggestion engine ===
//
// getUpsellSuggestions — assembles candidates from the cart, resolves prices,
//   computes margin impact, and ranks them via the pure ranker.
// addUpsell — accepts a suggestion by calling M5's addLine, then marks it accepted.

import { db } from "../../lib/db.js";
import { lineMarginPct, orderMarginPct } from "../../lib/margin.js";
import { resolveUnitPrice } from "../product/pricing.service.js";
import {
  loadQuotationWithLines,
  addLine,
} from "../quotation/quotation.service.js";
import { rankUpsells, type RankInput } from "./ranking.js";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Get ranked upsell suggestions for a quotation.
 *
 * 1. Load the quotation with lines + customer (for tier/currency)
 * 2. Find all UpsellRules triggered by products already in the cart
 * 3. Dedupe by suggestedId (keep strongest affinity)
 * 4. For each candidate: resolve price, compute margin impact
 * 5. Rank via pure ranker (filters out thin-margin suggestions)
 */
export async function getUpsellSuggestions(quotationId: string) {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });

  // Products already in cart — never suggest what's already there
  const inCart = new Set(q.lines.map((l) => l.productId));

  // Find all rules triggered by products in the cart
  const rules = await db.upsellRule.findMany({
    where: { productId: { in: [...inCart] } },
  });

  // Dedupe by suggestedId — keep the strongest co-purchase affinity
  const byId = new Map<
    string,
    { coPurchaseScore: number; minMarginPct: number }
  >();
  for (const r of rules) {
    if (inCart.has(r.suggestedId)) continue; // skip products already in cart
    const prev = byId.get(r.suggestedId);
    if (!prev || r.coPurchaseScore > prev.coPurchaseScore)
      byId.set(r.suggestedId, r);
  }

  // Compute current order margin as baseline
  const currentLines = q.lines.map((l) => ({
    netMinor:
      l.qty * l.unitPriceMinor -
      Math.round(l.qty * l.unitPriceMinor * (l.discountPct / 100)),
    costMinor: l.qty * l.unitCostMinor,
  }));
  const currentOrderMargin = orderMarginPct(currentLines);

  // Build candidates with margin impact
  const candidates: (RankInput & {
    marginDeltaPct: number;
    product: unknown;
  })[] = [];
  for (const [suggestedId, rule] of byId) {
    const product = await db.product.findUnique({ where: { id: suggestedId } });
    if (!product) continue;

    const unitPrice = await resolveUnitPrice({
      productId: suggestedId,
      customerTier: q.customer.tier,
      currency: q.customer.currency,
    });

    const resultingOrderMarginPct = orderMarginPct([
      ...currentLines,
      { netMinor: unitPrice, costMinor: product.unitCost },
    ]);

    candidates.push({
      suggestedId,
      coPurchaseScore: rule.coPurchaseScore,
      isPromoted: product.isPromoted,
      suggestionMarginPct: lineMarginPct(unitPrice, product.unitCost),
      minMarginPct: rule.minMarginPct,
      resultingOrderMarginPct,
      marginDeltaPct: round2(resultingOrderMarginPct - currentOrderMargin),
      product,
    });
  }

  // Rank via pure ranker (filters + sorts)
  const ranked = rankUpsells(
    candidates as RankInput[],
  ) as ((typeof candidates)[number] & { score: number })[];

  // Persist suggestions for analytics (what we showed)
  if (ranked.length > 0) {
    await db.upsellSuggestion.createMany({
      data: ranked.map((r) => ({
        quotationId,
        suggestedId: r.suggestedId,
        marginDeltaPct: r.marginDeltaPct,
        promoted: r.isPromoted,
      })),
      skipDuplicates: true,
    });
  }

  return ranked.map((r) => ({
    product: r.product,
    marginDeltaPct: r.marginDeltaPct,
    promoted: r.isPromoted,
    score: r.score,
  }));
}

/**
 * Accept a suggestion — adds a line to the quotation via M5's addLine,
 * marks the suggestion as accepted, and returns the fresh quotation.
 */
export async function addUpsell(
  quotationId: string,
  suggestedId: string,
  actor: { id: string; role: string },
) {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });

  // Use M5's addLine — it resolves price, creates QuotationLine, recomputes totals
  await addLine(
    quotationId,
    { productId: suggestedId, qty: 1, discountPct: 0, lineType: "ONE_TIME" },
    actor,
  );

  // Mark the suggestion as accepted (if it was persisted)
  await db.upsellSuggestion.updateMany({
    where: { quotationId, suggestedId },
    data: { accepted: true },
  });

  // Return fresh quotation with updated totals + margin
  return loadQuotationWithLines(quotationId);
}
