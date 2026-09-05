import type { Prisma, ProductCategory, QuotationStatus } from "@prisma/client";
import { db } from "../../lib/db.js";
import type { ReportFilters } from "./reports.schema.js";

type DbClient = {
  quotation: {
    // Prisma's groupBy delegate is generic-heavy; this module only depends on this result shape.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    groupBy: (args: any) => Promise<
      {
        status: QuotationStatus;
        _count: { _all: number };
        _sum: { grandTotalMinor: number | null };
      }[]
    >;
  };
  quotationLine: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findMany: (args: any) => Promise<
      {
        qty: number;
        unitPriceMinor: number;
        unitCostMinor: number;
        discountPct: number;
      }[]
    >;
  };
};

export type ReportViewer = {
  sub: string;
  role: string;
};

export type ReportDataset = {
  filters: ReportFilters & { effectiveRepId?: string };
  summary: {
    quoteCount: number;
    grossMinor: number;
    netMinor: number;
    costMinor: number;
    discountMinor: number;
    discountPct: number;
    marginPct: number;
  };
  funnel: { status: string; count: number; netMinor: number }[];
};

const STAGE_ORDER: QuotationStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "UNDER_NEGOTIATION",
  "CONFIRMED",
  "FULFILLMENT",
  "BILLING",
  "PAID",
  "REJECTED",
];

function effectiveRepId(
  filters: ReportFilters,
  viewer: ReportViewer,
): string | undefined {
  if (viewer.role === "sales_rep") {
    return viewer.sub;
  }

  return filters.repId;
}

function lineMoney(line: {
  qty: number;
  unitPriceMinor: number;
  unitCostMinor: number;
  discountPct: number;
}) {
  const grossMinor = line.qty * line.unitPriceMinor;
  const discountMinor = Math.round(grossMinor * (line.discountPct / 100));
  const netMinor = grossMinor - discountMinor;
  const costMinor = line.qty * line.unitCostMinor;

  return { grossMinor, discountMinor, netMinor, costMinor };
}

function summarizeLines(
  lines: {
    qty: number;
    unitPriceMinor: number;
    unitCostMinor: number;
    discountPct: number;
  }[],
) {
  const totals = lines.reduce(
    (sum, line) => {
      const money = lineMoney(line);
      return {
        grossMinor: sum.grossMinor + money.grossMinor,
        netMinor: sum.netMinor + money.netMinor,
        costMinor: sum.costMinor + money.costMinor,
        discountMinor: sum.discountMinor + money.discountMinor,
      };
    },
    { grossMinor: 0, netMinor: 0, costMinor: 0, discountMinor: 0 },
  );

  return {
    ...totals,
    discountPct:
      totals.grossMinor > 0
        ? (totals.discountMinor / totals.grossMinor) * 100
        : 0,
    marginPct:
      totals.netMinor > 0
        ? ((totals.netMinor - totals.costMinor) / totals.netMinor) * 100
        : 0,
  };
}

function quoteWhere(filters: ReportFilters, repId?: string) {
  const where: Prisma.QuotationWhereInput = {};

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = filters.from;
    }
    if (filters.to) {
      where.createdAt.lte = filters.to;
    }
  }
  if (repId) {
    where.salesRepId = repId;
  }
  if (filters.status) {
    where.status = filters.status as QuotationStatus;
  }
  if (filters.category) {
    where.lines = {
      some: { product: { category: filters.category as ProductCategory } },
    };
  }

  return where;
}

export async function buildReportDataset(
  filters: ReportFilters,
  viewer: ReportViewer,
  client: DbClient = db as unknown as DbClient,
): Promise<ReportDataset> {
  const repId = effectiveRepId(filters, viewer);
  const where = quoteWhere(filters, repId);

  const grouped = await client.quotation.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
    _sum: { grandTotalMinor: true },
  });

  const funnel = STAGE_ORDER.map((status) => {
    const group = grouped.find((item) => item.status === status);
    return {
      status,
      count: group?._count._all ?? 0,
      netMinor: group?._sum.grandTotalMinor ?? 0,
    };
  }).filter((stage) => stage.count > 0);

  const lines = await client.quotationLine.findMany({
    where: {
      quotation: where,
      ...(filters.category
        ? { product: { category: filters.category as ProductCategory } }
        : {}),
    },
    select: {
      qty: true,
      unitPriceMinor: true,
      unitCostMinor: true,
      discountPct: true,
    },
  });
  const summary = summarizeLines(lines);

  return {
    filters: { ...filters, effectiveRepId: repId },
    summary: {
      quoteCount: grouped.reduce((sum, group) => sum + group._count._all, 0),
      ...summary,
    },
    funnel,
  };
}
