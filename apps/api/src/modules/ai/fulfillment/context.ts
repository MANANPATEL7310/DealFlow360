import {
  getStockLevels,
  computeSplit,
} from "../../fulfillment/fulfillment.service.js";
import { loadQuotationWithLines } from "../../quotation/quotation.service.js";

export async function buildFulfillmentTaskPrompt(quotationId: string) {
  const quotation = await loadQuotationWithLines(quotationId);
  if (!quotation) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  const lines = quotation.lines
    .filter((line) => line.lineType === "ONE_TIME")
    .map((line) => ({
      productId: line.productId,
      productName: line.product.name,
      qty: line.qty,
    }));
  const stock = await getStockLevels(quotationId);
  const baseline = await computeSplit(quotationId);

  return JSON.stringify({
    quotationId,
    lines,
    stock,
    baseline,
  });
}
