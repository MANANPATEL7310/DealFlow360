// apps/api/src/modules/billing/billing.service.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  changeSubscription,
  generateBillingSchedule,
  recordPayment,
} from "./billing.service.js";
import { db } from "../../lib/db.js";
import { writeAudit } from "../../lib/audit.js";
import { transition } from "../quotation/lifecycle.js";

const FINANCE = { id: "user-finance", role: "finance" };
const ANCHOR = new Date("2026-01-01T00:00:00Z");

vi.mock("../../lib/db.js", () => {
  const mockDb = {
    billingSchedule: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    quotation: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    quotationLine: {
      findUniqueOrThrow: vi.fn(),
      findFirstOrThrow: vi.fn(),
    },
    invoice: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    creditNote: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirstOrThrow: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => {
      return cb(mockDb);
    }),
  };
  return { db: mockDb };
});

vi.mock("../../lib/audit.js", () => ({
  writeAudit: vi.fn(async () => undefined),
}));

vi.mock("../quotation/lifecycle.js", () => ({
  transition: vi.fn(async () => undefined),
}));

describe("generateBillingSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("splits one-time and recurring, issuing period 1 and drafting the rest", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.quotation.findUniqueOrThrow).mockResolvedValueOnce({
      id: "q-1",
      lines: [
        {
          id: "l-1",
          lineType: "ONE_TIME",
          qty: 1,
          unitPriceMinor: 10000,
          discountPct: 0,
          product: { taxRatePct: 10 },
          subscriptionPlan: null,
        },
        {
          id: "l-2",
          lineType: "RECURRING",
          qty: 1,
          unitPriceMinor: 3000,
          discountPct: 0,
          product: { taxRatePct: 0 },
          subscriptionPlan: { interval: "MONTHLY" },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof db.quotation.findUniqueOrThrow>>);

    vi.mocked(db.billingSchedule.create).mockResolvedValueOnce({
      id: "sched-1",
      quotationId: "q-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.create>>);

    const mockInvoices = [
      { kind: "ONE_TIME", amountMinor: 11000, status: "ISSUED" },
      ...Array.from({ length: 12 }, (_, i) => ({
        kind: "RECURRING",
        amountMinor: 3000,
        status: i === 0 ? "ISSUED" : "DRAFT",
      })),
    ];

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      invoices: mockInvoices,
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    const schedule = await generateBillingSchedule("q-1", ANCHOR);

    const oneTime = schedule.invoices.filter((i) => i.kind === "ONE_TIME");
    const recurring = schedule.invoices.filter((i) => i.kind === "RECURRING");
    expect(oneTime).toHaveLength(1);
    expect(oneTime[0]).toMatchObject({
      amountMinor: 11000,
      status: "ISSUED",
    });

    expect(recurring).toHaveLength(12);
    expect(recurring.filter((i) => i.status === "ISSUED")).toHaveLength(1);
    expect(recurring.filter((i) => i.status === "DRAFT")).toHaveLength(11);
    expect(recurring.every((i) => i.amountMinor === 3000)).toBe(true);
  });

  it("uses the interval horizon (QUARTERLY→4, YEARLY→1)", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.quotation.findUniqueOrThrow).mockResolvedValueOnce({
      id: "q-2",
      lines: [
        {
          id: "l-1",
          lineType: "RECURRING",
          qty: 1,
          unitPriceMinor: 9000,
          discountPct: 0,
          product: { taxRatePct: 0 },
          subscriptionPlan: { interval: "QUARTERLY" },
        },
      ],
    } as unknown as Awaited<ReturnType<typeof db.quotation.findUniqueOrThrow>>);

    vi.mocked(db.billingSchedule.create).mockResolvedValueOnce({
      id: "sched-2",
      quotationId: "q-2",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.create>>);

    const mockInvoices = Array.from({ length: 4 }, (_, i) => ({
      kind: "RECURRING",
      amountMinor: 9000,
      status: i === 0 ? "ISSUED" : "DRAFT",
    }));

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-2",
      invoices: mockInvoices,
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    const schedule = await generateBillingSchedule("q-2", ANCHOR);
    expect(
      schedule.invoices.filter((i) => i.kind === "RECURRING"),
    ).toHaveLength(4);
  });

  it("is idempotent — calling twice creates no duplicate schedule/invoices", async () => {
    const existingSchedule = {
      id: "sched-existing",
      quotationId: "q-3",
      invoices: [{ id: "inv-1" }],
      creditNotes: [],
    };

    vi.mocked(db.billingSchedule.findUnique).mockResolvedValue(
      existingSchedule as unknown as Awaited<
        ReturnType<typeof db.billingSchedule.findUnique>
      >,
    );

    const result1 = await generateBillingSchedule("q-3", ANCHOR);
    const result2 = await generateBillingSchedule("q-3", ANCHOR);

    expect(result1).toEqual(existingSchedule);
    expect(result2).toEqual(existingSchedule);
    expect(db.billingSchedule.create).not.toHaveBeenCalled();
  });
});

describe("changeSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UPGRADE creates a prorated catch-up charge and re-prices future periods", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce({
      id: "sched-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.findUnique>>);

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      lineId: "line-1",
      kind: "RECURRING",
      status: "ISSUED",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-02-01T00:00:00Z"),
      amountMinor: 6000,
    } as unknown as Awaited<ReturnType<typeof db.invoice.findFirst>>);

    vi.mocked(db.quotationLine.findUniqueOrThrow).mockResolvedValueOnce({
      id: "line-1",
      subscriptionPlan: { cancellationRule: "prorated_credit" },
    } as unknown as Awaited<
      ReturnType<typeof db.quotationLine.findUniqueOrThrow>
    >);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      invoices: [],
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    await changeSubscription("q-1", FINANCE.id, {
      lineId: "line-1",
      newPeriodAmountMinor: 9000,
      reason: "added seats",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });

    expect(db.invoice.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scheduleId: "sched-1",
        kind: "RECURRING",
        lineId: "line-1",
        amountMinor: 1548,
        status: "ISSUED",
      }),
    });

    expect(db.invoice.updateMany).toHaveBeenCalledWith({
      where: { scheduleId: "sched-1", lineId: "line-1", status: "DRAFT" },
      data: { amountMinor: 9000 },
    });

    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "billing.subscription.changed",
      }),
    );
  });

  it("DOWNGRADE with prorated_credit writes a credit note", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce({
      id: "sched-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.findUnique>>);

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      lineId: "line-1",
      kind: "RECURRING",
      status: "ISSUED",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-02-01T00:00:00Z"),
      amountMinor: 6000,
    } as unknown as Awaited<ReturnType<typeof db.invoice.findFirst>>);

    vi.mocked(db.quotationLine.findUniqueOrThrow).mockResolvedValueOnce({
      id: "line-1",
      subscriptionPlan: { cancellationRule: "prorated_credit" },
    } as unknown as Awaited<
      ReturnType<typeof db.quotationLine.findUniqueOrThrow>
    >);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      invoices: [],
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    await changeSubscription("q-1", FINANCE.id, {
      lineId: "line-1",
      newPeriodAmountMinor: 3000,
      reason: "dropped seats",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });

    expect(db.creditNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scheduleId: "sched-1",
        amountMinor: 1548,
        reason: "dropped seats",
        sourceInvoiceId: "inv-1",
      }),
    });
  });

  it("DOWNGRADE with cancellationRule 'none' issues NO credit note", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce({
      id: "sched-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.findUnique>>);

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      lineId: "line-1",
      kind: "RECURRING",
      status: "ISSUED",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-02-01T00:00:00Z"),
      amountMinor: 6000,
    } as unknown as Awaited<ReturnType<typeof db.invoice.findFirst>>);

    vi.mocked(db.quotationLine.findUniqueOrThrow).mockResolvedValueOnce({
      id: "line-1",
      subscriptionPlan: { cancellationRule: "none" },
    } as unknown as Awaited<
      ReturnType<typeof db.quotationLine.findUniqueOrThrow>
    >);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      invoices: [],
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    await changeSubscription("q-1", FINANCE.id, {
      lineId: "line-1",
      newPeriodAmountMinor: 3000,
      reason: "x",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });

    expect(db.creditNote.create).not.toHaveBeenCalled();
    expect(db.invoice.updateMany).toHaveBeenCalledWith({
      where: { scheduleId: "sched-1", lineId: "line-1", status: "DRAFT" },
      data: { amountMinor: 3000 },
    });
  });

  it("CANCEL voids future periods and credits the remainder", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce({
      id: "sched-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.findUnique>>);

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      lineId: "line-1",
      kind: "RECURRING",
      status: "ISSUED",
      periodStart: new Date("2026-01-01T00:00:00Z"),
      periodEnd: new Date("2026-02-01T00:00:00Z"),
      amountMinor: 6000,
    } as unknown as Awaited<ReturnType<typeof db.invoice.findFirst>>);

    vi.mocked(db.quotationLine.findUniqueOrThrow).mockResolvedValueOnce({
      id: "line-1",
      subscriptionPlan: { cancellationRule: "prorated_credit" },
    } as unknown as Awaited<
      ReturnType<typeof db.quotationLine.findUniqueOrThrow>
    >);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      invoices: [],
      creditNotes: [],
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    await changeSubscription("q-1", FINANCE.id, {
      lineId: "line-1",
      newPeriodAmountMinor: 0,
      reason: "cancel",
      changeDate: new Date("2026-01-16T00:00:00Z"),
    });

    expect(db.invoice.updateMany).toHaveBeenCalledWith({
      where: { scheduleId: "sched-1", lineId: "line-1", status: "DRAFT" },
      data: { status: "VOID" },
    });

    expect(db.creditNote.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountMinor: 3097,
      }),
    });

    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "billing.subscription.cancelled",
      }),
    );
  });

  it("rejects a change with no active (ISSUED) period", async () => {
    vi.mocked(db.billingSchedule.findUnique).mockResolvedValueOnce({
      id: "sched-1",
    } as unknown as Awaited<ReturnType<typeof db.billingSchedule.findUnique>>);

    vi.mocked(db.invoice.findFirst).mockResolvedValueOnce(null);

    await expect(
      changeSubscription("q-1", FINANCE.id, {
        lineId: "nope",
        newPeriodAmountMinor: 0,
        reason: "x",
      }),
    ).rejects.toMatchObject({ message: "NO_ACTIVE_PERIOD", http: 409 });
  });
});

describe("recordPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps an invoice ISSUED until fully covered, then flips it to PAID", async () => {
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      amountMinor: 11000,
      status: "ISSUED",
      payments: [],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUnique>>);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      quotationId: "q-1",
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    vi.mocked(db.invoice.count).mockResolvedValueOnce(1);
    vi.mocked(db.invoice.findUniqueOrThrow).mockResolvedValueOnce({
      id: "inv-1",
      status: "ISSUED",
      payments: [{ amountMinor: 5000, status: "recorded" }],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUniqueOrThrow>>);

    const res1 = await recordPayment("inv-1", 5000, FINANCE.id);
    expect(res1.status).toBe("ISSUED");
    expect(db.invoice.update).not.toHaveBeenCalled();

    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      amountMinor: 11000,
      status: "ISSUED",
      payments: [{ amountMinor: 5000, status: "recorded" }],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUnique>>);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      quotationId: "q-1",
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    vi.mocked(db.invoice.count).mockResolvedValueOnce(1);
    vi.mocked(db.invoice.findUniqueOrThrow).mockResolvedValueOnce({
      id: "inv-1",
      status: "PAID",
      payments: [
        { amountMinor: 5000, status: "recorded" },
        { amountMinor: 6000, status: "recorded" },
      ],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUniqueOrThrow>>);

    const res2 = await recordPayment("inv-1", 6000, FINANCE.id);
    expect(res2.status).toBe("PAID");
    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: "inv-1" },
      data: { status: "PAID" },
    });
  });

  it("refuses payment against a VOID invoice", async () => {
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      status: "VOID",
      payments: [],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUnique>>);

    await expect(
      recordPayment("inv-1", 5000, FINANCE.id),
    ).rejects.toMatchObject({ message: "INVOICE_VOID", http: 409 });
  });

  it("finalizes the quote to PAID when all DUE invoices are settled (future DRAFT periods don't block)", async () => {
    vi.mocked(db.invoice.findUnique).mockResolvedValueOnce({
      id: "inv-1",
      scheduleId: "sched-1",
      amountMinor: 11000,
      status: "ISSUED",
      payments: [],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUnique>>);

    vi.mocked(db.billingSchedule.findUniqueOrThrow).mockResolvedValueOnce({
      id: "sched-1",
      quotationId: "q-1",
    } as unknown as Awaited<
      ReturnType<typeof db.billingSchedule.findUniqueOrThrow>
    >);

    vi.mocked(db.invoice.count).mockResolvedValueOnce(0); // 0 due unpaid remaining
    vi.mocked(db.quotation.findUniqueOrThrow).mockResolvedValueOnce({
      id: "q-1",
      status: "BILLING",
    } as unknown as Awaited<ReturnType<typeof db.quotation.findUniqueOrThrow>>);

    vi.mocked(db.invoice.findUniqueOrThrow).mockResolvedValueOnce({
      id: "inv-1",
      status: "PAID",
      payments: [{ amountMinor: 11000, status: "recorded" }],
    } as unknown as Awaited<ReturnType<typeof db.invoice.findUniqueOrThrow>>);

    await recordPayment("inv-1", 11000, FINANCE.id);

    expect(transition).toHaveBeenCalledWith(
      expect.objectContaining({ id: "q-1", status: "BILLING" }),
      "PAID",
      FINANCE.id,
      "All due invoices settled",
    );
  });
});
