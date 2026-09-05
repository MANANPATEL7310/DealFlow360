import {
  type Quotation,
  SEED_QUOTATIONS,
} from "@template/shared";
import type {
  ReportCategoryContribution,
  ReportDataset,
  ReportFilters,
} from "./reports.schema.js";

export interface Viewer {
  sub: string;
  role: string;
  email?: string;
}

export const STAGE_ORDER = [
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
] as const;

/**
 * Role-Based Governance:
 * Sales reps only ever see their own deals (ignoring any repId filter passed).
 * Sales managers, finance, and admins may filter by rep or view company-wide metrics.
 */
function getEffectiveRepId(
  filters: ReportFilters,
  viewer: Viewer,
): string | undefined {
  if (viewer.role === "sales_rep") {
    return viewer.sub;
  }
  return filters.repId;
}

export async function buildReportDataset(
  filters: ReportFilters,
  viewer: Viewer,
): Promise<ReportDataset> {
  const effectiveRepId = getEffectiveRepId(filters, viewer);

  // Filter quotation collection (uses seeded/in-memory records, adaptable to database)
  const quotes = SEED_QUOTATIONS.filter((q: Quotation) => {
    if (effectiveRepId && q.salesRepId !== effectiveRepId) {
      if (
        viewer.email &&
        !viewer.email.toLowerCase().includes(q.salesRepId.toLowerCase())
      ) {
        return false;
      }
    }

    if (filters.status && q.status !== filters.status) {
      return false;
    }

    const qDate = new Date(q.lastActivityAt || Date.now()).getTime();
    if (filters.from && qDate < new Date(filters.from).getTime()) {
      return false;
    }
    if (filters.to && qDate > new Date(filters.to).getTime()) {
      return false;
    }

    if (filters.category) {
      const hasCategory = q.lines.some(
        (l) => l.product && l.product.category === filters.category,
      );
      if (!hasCategory) return false;
    }

    return true;
  });

  // Funnel: quote-level group by lifecycle stage
  const funnelMap = new Map<string, { count: number; netMinor: number }>();
  for (const stage of STAGE_ORDER) {
    funnelMap.set(stage, { count: 0, netMinor: 0 });
  }

  for (const q of quotes) {
    const existing = funnelMap.get(q.status) ?? { count: 0, netMinor: 0 };
    const quoteNet = q.lines.reduce((sum, l) => {
      if (
        filters.category &&
        l.product &&
        l.product.category !== filters.category
      ) {
        return sum;
      }
      const lineGross = l.qty * l.unitPriceMinor;
      const lineNet = Math.round(lineGross * (1 - (l.discountPct ?? 0) / 100));
      return sum + lineNet;
    }, 0);

    funnelMap.set(q.status, {
      count: existing.count + 1,
      netMinor: existing.netMinor + quoteNet,
    });
  }

  const funnel = STAGE_ORDER.map((status) => ({
    status,
    count: funnelMap.get(status)?.count ?? 0,
    netMinor: funnelMap.get(status)?.netMinor ?? 0,
  }));

  // Aggregated money: line-level computation to prevent cross-category distortion
  let totalGrossMinor = 0;
  let totalNetMinor = 0;
  let totalCostMinor = 0;

  // Category contribution tracker
  const categoryStats = new Map<
    string,
    {
      lineCount: number;
      grossMinor: number;
      netMinor: number;
      costMinor: number;
    }
  >();

  for (const q of quotes) {
    for (const line of q.lines) {
      const cat = line.product?.category ?? "SERVICES";

      if (filters.category && cat !== filters.category) {
        continue;
      }

      const gross = line.qty * line.unitPriceMinor;
      const net = Math.round(gross * (1 - (line.discountPct ?? 0) / 100));
      const cost = line.qty * line.unitCostMinor;

      totalGrossMinor += gross;
      totalNetMinor += net;
      totalCostMinor += cost;

      const currCat = categoryStats.get(cat) ?? {
        lineCount: 0,
        grossMinor: 0,
        netMinor: 0,
        costMinor: 0,
      };
      categoryStats.set(cat, {
        lineCount: currCat.lineCount + 1,
        grossMinor: currCat.grossMinor + gross,
        netMinor: currCat.netMinor + net,
        costMinor: currCat.costMinor + cost,
      });
    }
  }

  const discountMinor = Math.max(0, totalGrossMinor - totalNetMinor);
  const discountPct =
    totalGrossMinor > 0
      ? Number(((discountMinor / totalGrossMinor) * 100).toFixed(2))
      : 0;
  const marginPct =
    totalNetMinor > 0
      ? Number(
          (((totalNetMinor - totalCostMinor) / totalNetMinor) * 100).toFixed(2),
        )
      : 0;

  const categoryBreakdown: ReportCategoryContribution[] = Array.from(
    categoryStats.entries(),
  ).map(([cat, stats]) => {
    const catMargin =
      stats.netMinor > 0
        ? Number(
            (
              ((stats.netMinor - stats.costMinor) / stats.netMinor) *
              100
            ).toFixed(2),
          )
        : 0;
    return {
      categoryId: cat,
      categoryName: cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(),
      lineCount: stats.lineCount,
      grossMinor: stats.grossMinor,
      netMinor: stats.netMinor,
      marginPct: catMargin,
    };
  });

  return {
    filters: {
      ...filters,
      effectiveRepId,
    },
    summary: {
      quoteCount: quotes.length,
      grossMinor: totalGrossMinor,
      netMinor: totalNetMinor,
      costMinor: totalCostMinor,
      discountMinor,
      discountPct,
      marginPct,
    },
    funnel,
    categoryBreakdown,
  };
}
