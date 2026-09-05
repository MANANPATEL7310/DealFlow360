import type { BillingSchedule, Invoice } from "../schemas/billing";

const MS_PER_DAY = 86_400_000;

/**
 * Whole days between two dates (rounded, DST-safe).
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Calculates the prorated amount owed or credited for the slice of [periodStart, periodEnd]
 * remaining at/after changeDate. Pure, deterministic integer minor units.
 */
export function prorate(
  planAmountMinor: number,
  changeDate: Date,
  periodStart: Date,
  periodEnd: Date,
): number {
  const total = daysBetween(periodStart, periodEnd);
  if (total <= 0) return 0;
  const remaining = Math.min(Math.max(daysBetween(changeDate, periodEnd), 0), total);
  return Math.round(planAmountMinor * (remaining / total));
}

/**
 * Calculates total paid minor units for an invoice from recorded payments.
 */
export function paidMinor(invoice: Invoice): number {
  return (invoice.payments ?? [])
    .filter((p) => p.status === "recorded")
    .reduce((sum, p) => sum + p.amountMinor, 0);
}

/**
 * Calculates remaining balance due on an invoice.
 */
export function remainingMinor(invoice: Invoice): number {
  return Math.max(0, invoice.amountMinor - paidMinor(invoice));
}

/**
 * Returns true if an invoice is fully covered by recorded payments.
 */
export function isFullyPaid(invoice: Invoice): boolean {
  return invoice.amountMinor > 0 && remainingMinor(invoice) === 0;
}

/**
 * Groups invoices into a single one-time aggregate invoice and a Map of
 * recurring invoice series keyed by lineId, chronologically sorted.
 */
export function groupInvoices(invoices: Invoice[]): {
  oneTime: Invoice | null;
  recurring: Map<string, Invoice[]>;
} {
  const oneTime = invoices.find((i) => i.kind === "ONE_TIME") ?? null;
  const recurring = new Map<string, Invoice[]>();

  for (const inv of invoices.filter((x) => x.kind === "RECURRING")) {
    const key = inv.lineId ?? "default";
    const existing = recurring.get(key);
    if (existing) {
      existing.push(inv);
    } else {
      recurring.set(key, [inv]);
    }
  }

  for (const list of recurring.values()) {
    list.sort((a, b) => {
      const startA = a.periodStart ?? "";
      const startB = b.periodStart ?? "";
      return startA.localeCompare(startB);
    });
  }

  return { oneTime, recurring };
}

/**
 * Calculates high-level financial summary across a billing schedule.
 */
export function summarizeSchedule(schedule: BillingSchedule) {
  const nonVoidInvoices = schedule.invoices.filter((i) => i.status !== "VOID");
  const totalInvoicedMinor = nonVoidInvoices.reduce((sum, i) => sum + i.amountMinor, 0);
  const totalPaidMinor = nonVoidInvoices.reduce((sum, i) => sum + paidMinor(i), 0);
  const totalOutstandingMinor = nonVoidInvoices
    .filter((i) => i.status === "ISSUED")
    .reduce((sum, i) => sum + remainingMinor(i), 0);
  const totalCreditsMinor = (schedule.creditNotes ?? []).reduce(
    (sum, c) => sum + c.amountMinor,
    0,
  );

  return {
    totalInvoicedMinor,
    totalPaidMinor,
    totalOutstandingMinor,
    totalCreditsMinor,
    invoiceCount: schedule.invoices.length,
    activeInvoicesCount: nonVoidInvoices.length,
    creditNotesCount: schedule.creditNotes.length,
  };
}
