import { loadNegotiationRequest } from "../../portal/portal.service.js";

/**
 * Builds non-PII prompt describing the customer's negotiation counter.
 * Only includes deal economics, requested counter %, lines, comments, and tier.
 * Customer names, emails, and phone numbers are excluded.
 */
export async function buildNegotiationTaskPrompt(
  requestId: string,
): Promise<string> {
  const neg = await loadNegotiationRequest(requestId);

  const affectedLinesSummary = neg.affectedLines.map((l, idx) => ({
    itemIndex: idx + 1,
    lineId: l.id,
    product: l.product.name,
    category: l.product.category,
    quantity: l.qty,
    unitPriceMinor: l.unitPriceMinor,
    currentDiscountPct: l.discountPct,
  }));

  const payload = {
    task: "Assist internal sales representative with customer negotiation counter",
    requestId: neg.id,
    quotationId: neg.quotationId,
    customerTier: neg.customerTier,
    currency: neg.currency,
    counterDiscountPct: neg.counterDiscountPct,
    customerComment: neg.comment,
    affectedLines: affectedLinesSummary,
  };

  return JSON.stringify(payload, null, 2);
}
