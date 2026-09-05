import { getBillingSchedule } from "../../billing/billing.service.js";
import { loadQuotationWithLines } from "../../quotation/quotation.service.js";

export async function buildBillingTaskPrompt(
  quotationId: string,
): Promise<string> {
  const q = await loadQuotationWithLines(quotationId);
  if (!q) {
    throw Object.assign(new Error("QUOTATION_NOT_FOUND"), { http: 404 });
  }

  const schedule = await getBillingSchedule(quotationId);

  const invoiceSummaries = (schedule?.invoices ?? []).map(
    (inv) =>
      `- Invoice ${inv.id} (${inv.kind}, status: ${inv.status}): amount minor ${inv.amountMinor}` +
      (inv.periodStart && inv.periodEnd
        ? `, period: ${inv.periodStart.toISOString().slice(0, 10)} to ${inv.periodEnd.toISOString().slice(0, 10)}`
        : ""),
  );

  return [
    `Quotation ID: ${quotationId}`,
    `Customer: ${q.customer?.name ?? "Customer"} (Tier: ${q.customer?.tier ?? "STANDARD"})`,
    `Schedule ID: ${schedule?.id ?? "None (not generated yet)"}`,
    `Invoices (${invoiceSummaries.length}):`,
    ...(invoiceSummaries.length > 0
      ? invoiceSummaries
      : ["(no invoices on schedule)"]),
    "",
    "Please inspect the billing schedule, verify payments or proration math, and explain the customer's billing status.",
  ].join("\n");
}
