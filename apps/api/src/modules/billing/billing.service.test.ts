// apps/api/src/modules/billing/billing.service.test.ts
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../lib/db.js";
import {
  changeSubscription,
  generateBillingSchedule,
  moveToBilling,
  recordPayment,
} from "./billing.service.js";
import {
  FINANCE,
  getFinanceUser,
  seedHybridQuote,
} from "../../test/helpers.js";

const ANCHOR = new Date("2026-01-01T00:00:00Z");

const sched = (q: { id: string }) =>
  db.billingSchedule.findUniqueOrThrow({ where: { quotationId: q.id } });

beforeAll(async () => {
  await getFinanceUser();
}, 30000);

beforeEach(async () => {
  await db.$transaction([
    db.payment.deleteMany(),
    db.invoice.deleteMany(),
    db.creditNote.deleteMany(),
    db.billingSchedule.deleteMany(),
  ]);
}, 30000);

describe("generateBillingSchedule", () => {
  it("splits one-time and recurring, issuing period 1 and drafting the rest", async () => {
    // one-time: qty1 × $100 @10% tax = 11000 ; recurring: qty1 × $30/mo, MONTHLY
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 10000, qty: 1, discountPct: 0, taxRatePct: 10 },
      ],
      recurring: [
        {
          unitPriceMinor: 3000,
          qty: 1,
          discountPct: 0,
          taxRatePct: 0,
          interval: "MONTHLY",
        },
      ],
    });
    const schedule = await generateBillingSchedule(q.id, ANCHOR);

    const oneTime = schedule.invoices.filter((i) => i.kind === "ONE_TIME");
    const recurring = schedule.invoices.filter((i) => i.kind === "RECURRING");
    expect(oneTime).toHaveLength(1);
    expect(oneTime[0]).toMatchObject({
      amountMinor: 11000,
      status: "ISSUED",
    });

    expect(recurring).toHaveLength(12); // MONTHLY horizon = 12
    expect(recurring.filter((i) => i.status === "ISSUED")).toHaveLength(1);
    expect(recurring.filter((i) => i.status === "DRAFT")).toHaveLength(11);
    expect(recurring.every((i) => i.amountMinor === 3000)).toBe(true);
  });

  it("uses the interval horizon (QUARTERLY→4, YEARLY→1)", async () => {
    const q = await seedHybridQuote({
      recurring: [
        {
          unitPriceMinor: 9000,
          qty: 1,
          discountPct: 0,
          taxRatePct: 0,
          interval: "QUARTERLY",
        },
      ],
    });
    const schedule = await generateBillingSchedule(q.id, ANCHOR);
    expect(
      schedule.invoices.filter((i) => i.kind === "RECURRING"),
    ).toHaveLength(4);
  });

  it("is idempotent — calling twice creates no duplicate schedule/invoices", async () => {
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 5000, qty: 1, discountPct: 0, taxRatePct: 0 },
      ],
    });
    await generateBillingSchedule(q.id, ANCHOR);
    await generateBillingSchedule(q.id, ANCHOR);
    expect(
      await db.billingSchedule.count({ where: { quotationId: q.id } }),
    ).toBe(1);
    expect(await db.invoice.count()).toBe(1);
  });
});

describe("changeSubscription", () => {
  async function monthlyQuote(
    rule: "prorated_credit" | "none" = "prorated_credit",
  ) {
    const q = await seedHybridQuote({
      recurring: [
        {
          unitPriceMinor: 6000,
          qty: 1,
          discountPct: 0,
          taxRatePct: 0,
          interval: "MONTHLY",
          cancellationRule: rule,
        },
      ],
    });
    await generateBillingSchedule(q.id, ANCHOR); // period 1 = Jan1→Feb1 (31 days), amount 6000
    const line = await db.quotationLine.findFirstOrThrow({
      where: { quotationId: q.id, lineType: "RECURRING" },
    });
    return { q, lineId: line.id };
  }

  it("UPGRADE creates a prorated catch-up charge and re-prices future periods", async () => {
    const { q, lineId } = await monthlyQuote();
    await changeSubscription(q.id, FINANCE.id, {
      lineId,
      newPeriodAmountMinor: 9000,
      reason: "added seats",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });
    // catch-up = prorate(9000-6000, Jan16, Jan1, Feb1) = round(3000 · 16/31) = 1548
    const s = await sched(q);
    const charge = await db.invoice.findFirst({
      where: {
        scheduleId: s.id,
        kind: "RECURRING",
        periodStart: new Date("2026-01-16T00:00:00Z"),
      },
    });
    expect(charge).toMatchObject({ amountMinor: 1548, status: "ISSUED" });
    const futures = await db.invoice.findMany({
      where: { lineId, status: "DRAFT" },
    });
    expect(futures.every((i) => i.amountMinor === 9000)).toBe(true);
  });

  it("DOWNGRADE with prorated_credit writes a credit note", async () => {
    const { q, lineId } = await monthlyQuote("prorated_credit");
    await changeSubscription(q.id, FINANCE.id, {
      lineId,
      newPeriodAmountMinor: 3000,
      reason: "dropped seats",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });
    const notes = await db.creditNote.findMany();
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ amountMinor: 1548 }); // prorate(3000, Jan16, …)
  });

  it("DOWNGRADE with cancellationRule 'none' issues NO credit note", async () => {
    const { q, lineId } = await monthlyQuote("none");
    await changeSubscription(q.id, FINANCE.id, {
      lineId,
      newPeriodAmountMinor: 3000,
      reason: "x",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });
    expect(await db.creditNote.count()).toBe(0);
    expect(
      (await db.invoice.findMany({ where: { lineId, status: "DRAFT" } })).every(
        (i) => i.amountMinor === 3000,
      ),
    ).toBe(true);
  });

  it("CANCEL voids future periods and credits the remainder", async () => {
    const { q, lineId } = await monthlyQuote("prorated_credit");
    await changeSubscription(q.id, FINANCE.id, {
      lineId,
      newPeriodAmountMinor: 0,
      reason: "cancel",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });
    expect(await db.invoice.count({ where: { lineId, status: "VOID" } })).toBe(
      11,
    );
    expect((await db.creditNote.findFirstOrThrow()).amountMinor).toBe(3097); // round(6000 · 16/31)
  });

  it("rejects a change with no active (ISSUED) period", async () => {
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 5000, qty: 1, discountPct: 0, taxRatePct: 0 },
      ],
    });
    await generateBillingSchedule(q.id, ANCHOR);
    await expect(
      changeSubscription(q.id, FINANCE.id, {
        lineId: "nope",
        newPeriodAmountMinor: 0,
        reason: "x",
      }),
    ).rejects.toMatchObject({ message: "NO_ACTIVE_PERIOD", http: 409 });
  });
});

describe("recordPayment", () => {
  it("keeps an invoice ISSUED until fully covered, then flips it to PAID", async () => {
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 11000, qty: 1, discountPct: 0, taxRatePct: 0 },
      ],
    });
    const schedule = await generateBillingSchedule(q.id, ANCHOR);
    const invId = schedule.invoices[0]!.id;

    let inv = await recordPayment(invId, 5000, FINANCE.id);
    expect(inv.status).toBe("ISSUED");
    inv = await recordPayment(invId, 6000, FINANCE.id);
    expect(inv.status).toBe("PAID");
  });

  it("refuses payment against a VOID invoice", async () => {
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 5000, qty: 1, discountPct: 0, taxRatePct: 0 },
      ],
    });
    const schedule = await generateBillingSchedule(q.id, ANCHOR);
    await db.invoice.update({
      where: { id: schedule.invoices[0]!.id },
      data: { status: "VOID" },
    });
    await expect(
      recordPayment(schedule.invoices[0]!.id, 5000, FINANCE.id),
    ).rejects.toMatchObject({ message: "INVOICE_VOID", http: 409 });
  });

  it("finalizes the quote to PAID when all DUE invoices are settled (future DRAFT periods don't block)", async () => {
    const q = await seedHybridQuote({
      oneTime: [
        { unitPriceMinor: 11000, qty: 1, discountPct: 0, taxRatePct: 0 },
      ],
      recurring: [
        {
          unitPriceMinor: 3000,
          qty: 1,
          discountPct: 0,
          taxRatePct: 0,
          interval: "MONTHLY",
        },
      ],
      status: "FULFILLMENT",
    });
    const schedule = await generateBillingSchedule(q.id, ANCHOR);
    await moveToBilling(q.id, FINANCE.id); // FULFILLMENT → BILLING

    for (const inv of schedule.invoices.filter((i) => i.status === "ISSUED")) {
      await recordPayment(inv.id, inv.amountMinor, FINANCE.id);
    }

    expect(
      (await db.quotation.findUniqueOrThrow({ where: { id: q.id } })).status,
    ).toBe("PAID");
    expect(
      await db.invoice.count({
        where: { scheduleId: schedule.id, status: "DRAFT" },
      }),
    ).toBe(11); // still there, unblocking
  });
});
