import { loadQuotationWithLines } from "../../quotation/quotation.service.js";
import { orderMarginPct } from "../../../lib/margin.js";

/**
 * Builds a strictly non-PII prompt for Agent 1 (Discount Approval Assistant).
 * Only includes pricing, products, categories, discounts, quantities, margins, and tier.
 * Customer names, emails, phone numbers, and addresses are omitted.
 */
export async function buildDiscountTaskPrompt(
  quotationId: string,
): Promise<string> {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  const marginLines = q.lines.map((l) => {
    const gross = l.qty * l.unitPriceMinor;
    const net = gross - Math.round(gross * (l.discountPct / 100));
    const cost = l.qty * l.unitCostMinor;
    return { netMinor: net, costMinor: cost };
  });
  const calculatedMarginPct = Number(orderMarginPct(marginLines).toFixed(2));

  const linesSummary = q.lines.map((l, index) => ({
    itemIndex: index + 1,
    lineId: l.id,
    product: l.product.name,
    category: l.product.category,
    quantity: l.qty,
    unitPriceMinor: l.unitPriceMinor,
    discountPct: l.discountPct,
    lineTotalMinor: Math.round(
      l.qty * l.unitPriceMinor * (1 - l.discountPct / 100),
    ),
  }));

  const payload = {
    task: "Evaluate quotation discount request for human approver",
    quotationId: q.id,
    currency: q.customer.currency,
    customerTier: q.customer.tier,
    totals: {
      subtotalMinor: q.subtotalMinor,
      discountTotalMinor: q.discountTotalMinor,
      taxTotalMinor: q.taxTotalMinor,
      grandTotalMinor: q.grandTotalMinor,
      orderMarginPct: calculatedMarginPct,
    },
    lines: linesSummary,
  };

  return JSON.stringify(payload, null, 2);
}
