// apps/api/src/modules/billing/billing.service.ts
// === M8: Hybrid Billing & Invoicing Service ===
import { writeAudit } from "../../lib/audit.js";
import { db } from "../../lib/db.js";
import { transition } from "../quotation/lifecycle.js";
import { prorate } from "./proration.js";

type BillingLine = {
  qty: number;
  unitPriceMinor: number;
  discountPct: number;
  product: { taxRatePct: number | null };
};

export function lineBilledMinor(l: BillingLine): number {
  const gross = l.qty * l.unitPriceMinor;
  const net = gross - Math.round(gross * (l.discountPct / 100));
  const tax = Math.round(net * ((l.product?.taxRatePct ?? 0) / 100));
  return net + tax; // integer cents the customer pays for this line/period
}

const MONTHS_PER: Record<"MONTHLY" | "QUARTERLY" | "YEARLY", number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};

const HORIZON: Record<"MONTHLY" | "QUARTERLY" | "YEARLY", number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  YEARLY: 1,
}; // one year ahead

const addMonths = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

/**
 * Generates the hybrid billing schedule for a CONFIRMED quotation.
 * Idempotent — safe to call multiple times.
 */
export async function generateBillingSchedule(
  quotationId: string,
  anchor: Date = new Date(),
) {
  const existing = await db.billingSchedule.findUnique({
    where: { quotationId },
    include: { invoices: true, creditNotes: true },
  });
  if (existing) return existing;

  const q = await db.quotation.findUniqueOrThrow({
    where: { id: quotationId },
    include: {
      lines: {
        include: {
          product: true,
          subscriptionPlan: true,
        },
      },
    },
  });

  return db.$transaction(async (tx) => {
    const schedule = await tx.billingSchedule.create({
      data: { quotationId },
    });

    // 1) One-time lines -> aggregate single ISSUED invoice
    const oneTimeTotal = q.lines
      .filter((l) => l.lineType === "ONE_TIME")
      .reduce((s, l) => s + lineBilledMinor(l), 0);

    if (oneTimeTotal > 0) {
      await tx.invoice.create({
        data: {
          scheduleId: schedule.id,
          kind: "ONE_TIME",
          amountMinor: oneTimeTotal,
          status: "ISSUED",
        },
      });
    }

    // 2) Each recurring line with plan -> horizon of period invoices (period 1 ISSUED, rest DRAFT)
    for (const l of q.lines.filter(
      (x) => x.lineType === "RECURRING" && x.subscriptionPlan,
    )) {
      const plan = l.subscriptionPlan!;
      const perPeriod = lineBilledMinor(l);
      const step = MONTHS_PER[plan.interval];
      let periodStart = anchor;

      for (let i = 0; i < HORIZON[plan.interval]; i++) {
        const periodEnd = addMonths(periodStart, step);
        await tx.invoice.create({
          data: {
            scheduleId: schedule.id,
            kind: "RECURRING",
            lineId: l.id,
            periodStart,
            periodEnd,
            amountMinor: perPeriod,
            status: i === 0 ? "ISSUED" : "DRAFT",
          },
        });
        periodStart = periodEnd;
      }
    }

    return tx.billingSchedule.findUniqueOrThrow({
      where: { id: schedule.id },
      include: { invoices: true, creditNotes: true },
    });
  });
}

/**
 * Mid-cycle subscription change: upgrade, downgrade, or cancel.
 * Computes prorated charges/credits and re-prices future draft periods.
 */
export async function changeSubscription(
  quotationId: string,
  actorId: string,
  input: {
    lineId: string;
    newPeriodAmountMinor: number;
    reason: string;
    changeDate?: Date;
  },
) {
  const schedule = await db.billingSchedule.findUnique({
    where: { quotationId },
  });
  if (!schedule) {
    throw Object.assign(new Error("SCHEDULE_NOT_FOUND"), { http: 404 });
  }

  // The currently active (ISSUED) recurring invoice for this subscription line
  const current = await db.invoice.findFirst({
    where: {
      scheduleId: schedule.id,
      lineId: input.lineId,
      kind: "RECURRING",
      status: "ISSUED",
    },
    orderBy: { periodStart: "asc" },
  });

  if (!current || !current.periodStart || !current.periodEnd) {
    throw Object.assign(new Error("NO_ACTIVE_PERIOD"), { http: 409 });
  }

  const line = await db.quotationLine.findUniqueOrThrow({
    where: { id: input.lineId },
    include: { subscriptionPlan: true },
  });

  const changeDate = input.changeDate ?? new Date();
  const delta = input.newPeriodAmountMinor - current.amountMinor;
  const proratedMagnitude = prorate(
    Math.abs(delta),
    changeDate,
    current.periodStart,
    current.periodEnd,
  );
  const cancelling = input.newPeriodAmountMinor === 0;

  return db.$transaction(async (tx) => {
    if (delta > 0) {
      // UPGRADE — bill remainder of current period now
      if (proratedMagnitude > 0) {
        await tx.invoice.create({
          data: {
            scheduleId: schedule.id,
            kind: "RECURRING",
            lineId: input.lineId,
            periodStart: changeDate,
            periodEnd: current.periodEnd,
            amountMinor: proratedMagnitude,
            status: "ISSUED",
          },
        });
      }
    } else if (delta < 0) {
      // DOWNGRADE / CANCEL — credit remainder iff plan allows it
      if (
        line.subscriptionPlan?.cancellationRule === "prorated_credit" &&
        proratedMagnitude > 0
      ) {
        await tx.creditNote.create({
          data: {
            scheduleId: schedule.id,
            reason: input.reason,
            amountMinor: proratedMagnitude,
            sourceInvoiceId: current.id,
          },
        });
      }
    }

    // Re-price or void all future draft periods for this subscription line
    await tx.invoice.updateMany({
      where: {
        scheduleId: schedule.id,
        lineId: input.lineId,
        status: "DRAFT",
      },
      data: cancelling
        ? { status: "VOID" }
        : { amountMinor: input.newPeriodAmountMinor },
    });

    await writeAudit({
      actorId,
      actorKind: "user",
      action: cancelling
        ? "billing.subscription.cancelled"
        : "billing.subscription.changed",
      entity: "BillingSchedule",
      entityId: schedule.id,
      reason: input.reason,
      diff: {
        lineId: input.lineId,
        delta,
        prorated: proratedMagnitude,
      },
    });

    return tx.billingSchedule.findUniqueOrThrow({
      where: { id: schedule.id },
      include: { invoices: true, creditNotes: true },
    });
  });
}

/**
 * Records a payment against an invoice.
 * If total recorded payments cover invoice amount, flips status to PAID.
 * If all due invoices are settled, finalizes quotation to PAID.
 */
export async function recordPayment(
  invoiceId: string,
  amountMinor: number,
  actorId: string,
) {
  const invoice = await db.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw Object.assign(new Error("INVOICE_NOT_FOUND"), { http: 404 });
  }
  if (invoice.status === "VOID") {
    throw Object.assign(new Error("INVOICE_VOID"), { http: 409 });
  }

  return db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId,
        amountMinor,
        status: "recorded",
      },
    });

    const paid =
      invoice.payments
        .filter((p) => p.status === "recorded")
        .reduce((s, p) => s + p.amountMinor, 0) + amountMinor;

    if (paid >= invoice.amountMinor && invoice.status !== "PAID") {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });
    }

    await writeAudit({
      actorId,
      actorKind: "user",
      action: "billing.payment.recorded",
      entity: "Invoice",
      entityId: invoiceId,
      diff: {
        amountMinor,
        covered: paid >= invoice.amountMinor,
      },
    });

    await maybeFinalizeQuotation(tx, invoice.scheduleId, actorId);

    return tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { payments: true },
    });
  });
}

/**
 * Checks whether all currently due (ISSUED) invoices are paid.
 * If so and the quotation is in BILLING, advances it to PAID.
 * Future DRAFT invoices do not block finalization.
 */
async function maybeFinalizeQuotation(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  scheduleId: string,
  actorId: string,
) {
  const schedule = await tx.billingSchedule.findUniqueOrThrow({
    where: { id: scheduleId },
  });
  const dueUnpaid = await tx.invoice.count({
    where: { scheduleId, status: "ISSUED" },
  });
  if (dueUnpaid > 0) return;

  const q = await tx.quotation.findUniqueOrThrow({
    where: { id: schedule.quotationId },
  });
  if (q.status === "BILLING") {
    await transition(q, "PAID", actorId, "All due invoices settled");
  }
}

/**
 * Hook triggered when a quotation reaches CONFIRMED.
 */
export const onConfirmed = (quotationId: string, anchor?: Date) =>
  generateBillingSchedule(quotationId, anchor);

/**
 * Advances quotation from FULFILLMENT to BILLING.
 */
export async function moveToBilling(quotationId: string, actorId: string) {
  const q = await db.quotation.findUniqueOrThrow({
    where: { id: quotationId },
  });
  await transition(q, "BILLING", actorId, "Entering billing");
}

/**
 * Loads the billing schedule for a quotation including invoices and credit notes.
 */
export async function getBillingSchedule(quotationId: string) {
  return db.billingSchedule.findUnique({
    where: { quotationId },
    include: {
      invoices: { orderBy: [{ periodStart: "asc" }, { createdAt: "asc" }] },
      creditNotes: { orderBy: { createdAt: "asc" } },
    },
  });
}

/**
 * Reconciles payments recorded vs invoices due for a quotation.
 */
export async function reconcilePayments(quotationId: string) {
  const schedule = await getBillingSchedule(quotationId);
  if (!schedule) {
    return { error: "SCHEDULE_NOT_FOUND", quotationId };
  }

  const invoices = await db.invoice.findMany({
    where: { scheduleId: schedule.id },
    include: { payments: true },
  });

  const totalBilledMinor = invoices.reduce(
    (sum, inv) => sum + inv.amountMinor,
    0,
  );
  const totalPaidMinor = invoices.reduce(
    (sum, inv) =>
      sum +
      inv.payments
        .filter((p) => p.status === "recorded")
        .reduce((pSum, p) => pSum + p.amountMinor, 0),
    0,
  );

  const openInvoices = invoices.filter((inv) => inv.status === "ISSUED");
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");
  const draftInvoices = invoices.filter((inv) => inv.status === "DRAFT");

  return {
    scheduleId: schedule.id,
    quotationId,
    totalBilledMinor,
    totalPaidMinor,
    outstandingMinor: Math.max(0, totalBilledMinor - totalPaidMinor),
    openInvoicesCount: openInvoices.length,
    paidInvoicesCount: paidInvoices.length,
    draftInvoicesCount: draftInvoices.length,
    mismatches: openInvoices.map((inv) => ({
      invoiceId: inv.id,
      kind: inv.kind,
      amountMinor: inv.amountMinor,
      status: inv.status,
    })),
  };
}

/**
 * Simulates proration for mid-cycle changes.
 */
export async function simulateProration(opts: {
  subscriptionId?: string;
  lineId?: string;
  changeDate?: string | Date;
  newPeriodAmountMinor?: number;
}) {
  const changeDate = opts.changeDate ? new Date(opts.changeDate) : new Date();
  const lineId = opts.lineId ?? opts.subscriptionId;

  if (!lineId) {
    return { prorationBreakdown: [], netMinor: 0 };
  }

  const line = await db.quotationLine.findUnique({
    where: { id: lineId },
    include: { subscriptionPlan: true },
  });

  if (!line) {
    return { prorationBreakdown: [], netMinor: 0 };
  }

  const currentInvoice = await db.invoice.findFirst({
    where: { lineId, kind: "RECURRING", status: "ISSUED" },
    orderBy: { periodStart: "asc" },
  });

  if (
    !currentInvoice ||
    !currentInvoice.periodStart ||
    !currentInvoice.periodEnd
  ) {
    return { prorationBreakdown: [], netMinor: 0 };
  }

  const newAmount = opts.newPeriodAmountMinor ?? 0;
  const delta = newAmount - currentInvoice.amountMinor;
  const proratedMagnitude = prorate(
    Math.abs(delta),
    changeDate,
    currentInvoice.periodStart,
    currentInvoice.periodEnd,
  );

  return {
    prorationBreakdown: [
      {
        periodStart: changeDate.toISOString(),
        periodEnd: currentInvoice.periodEnd.toISOString(),
        amountMinor: delta >= 0 ? proratedMagnitude : -proratedMagnitude,
      },
    ],
    netMinor: delta >= 0 ? proratedMagnitude : -proratedMagnitude,
    cancellationRule: line.subscriptionPlan?.cancellationRule,
  };
}
