import { loadQuotationWithLines } from "../../quotation/quotation.service.js";

export async function buildCartSummary(quotationId: string): Promise<string> {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  const items = q.lines.map(
    (l) =>
      `- ${l.product?.name ?? "Item"} (${l.product?.category ?? "General"}): qty ${l.qty}, unit price minor ${l.unitPriceMinor}`,
  );

  return [
    `Quotation ID: ${quotationId}`,
    `Customer Tier: ${q.customer?.tier ?? "STANDARD"}`,
    `Current Lines (${items.length}):`,
    ...(items.length > 0 ? items : ["(no lines currently)"]),
    "",
    "Please analyze the quotation lines, inspect candidate upsell suggestions, and return ranked recommendations with margin impact.",
  ].join("\n");
}
