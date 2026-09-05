import type { QuotationStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { buildReportDataset } from "./report-dataset.js";
import type { ReportFilters } from "./reports.schema.js";

type GroupByArgs = {
  where: Record<string, unknown>;
};
type FindManyArgs = {
  where: Record<string, unknown>;
};

function client({
  grouped,
  lines,
}: {
  grouped: {
    status: QuotationStatus;
    _count: { _all: number };
    _sum: { grandTotalMinor: number | null };
  }[];
  lines: {
    qty: number;
    unitPriceMinor: number;
    unitCostMinor: number;
    discountPct: number;
  }[];
}) {
  return {
    quotation: {
      groupBy: vi.fn(async (_args: GroupByArgs) => grouped),
    },
    quotationLine: {
      findMany: vi.fn(async (_args: FindManyArgs) => lines),
    },
  };
}

describe("buildReportDataset", () => {
  it("forces sales reps to their own deals", async () => {
    const fake = client({ grouped: [], lines: [] });

    const dataset = await buildReportDataset(
      { repId: "cmanager000000000000000001" } as ReportFilters,
      { sub: "crep0000000000000000000001", role: "sales_rep" },
      fake,
    );

    expect(fake.quotation.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { salesRepId: "crep0000000000000000000001" },
      }),
    );
    expect(dataset.filters.effectiveRepId).toBe("crep0000000000000000000001");
  });

  it("allows managers to filter by rep", async () => {
    const fake = client({ grouped: [], lines: [] });

    await buildReportDataset(
      { repId: "crep0000000000000000000001" } as ReportFilters,
      { sub: "cmanager000000000000000001", role: "sales_manager" },
      fake,
    );

    expect(fake.quotation.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { salesRepId: "crep0000000000000000000001" },
      }),
    );
  });

  it("applies date, status, and category filters", async () => {
    const fake = client({ grouped: [], lines: [] });
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-01-31T00:00:00Z");

    await buildReportDataset(
      { from, to, status: "SENT", category: "HARDWARE" },
      { sub: "cmanager000000000000000001", role: "admin" },
      fake,
    );

    expect(fake.quotation.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: { gte: from, lte: to },
          status: "SENT",
          lines: { some: { product: { category: "HARDWARE" } } },
        },
      }),
    );
    expect(fake.quotationLine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          quotation: {
            createdAt: { gte: from, lte: to },
            status: "SENT",
            lines: { some: { product: { category: "HARDWARE" } } },
          },
          product: { category: "HARDWARE" },
        },
      }),
    );
  });

  it("returns deterministic summary money and ordered funnel", async () => {
    const fake = client({
      grouped: [
        {
          status: "PAID" as QuotationStatus,
          _count: { _all: 1 },
          _sum: { grandTotalMinor: 18000 },
        },
        {
          status: "SENT" as QuotationStatus,
          _count: { _all: 2 },
          _sum: { grandTotalMinor: 15000 },
        },
      ],
      lines: [
        { qty: 2, unitPriceMinor: 10000, unitCostMinor: 6000, discountPct: 10 },
        { qty: 1, unitPriceMinor: 5000, unitCostMinor: 2000, discountPct: 0 },
      ],
    });

    const dataset = await buildReportDataset(
      {},
      { sub: "cadmin0000000000000000001", role: "admin" },
      fake,
    );

    expect(dataset.summary).toEqual({
      quoteCount: 3,
      grossMinor: 25000,
      netMinor: 23000,
      costMinor: 14000,
      discountMinor: 2000,
      discountPct: 8,
      marginPct: (9000 / 23000) * 100,
    });
    expect(dataset.funnel).toEqual([
      { status: "SENT", count: 2, netMinor: 15000 },
      { status: "PAID", count: 1, netMinor: 18000 },
    ]);
  });
});
