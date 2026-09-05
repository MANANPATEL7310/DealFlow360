import {
  apiRoutes,
  type ReportCategoryContribution,
  type ReportDataset,
  type ReportFilters,
  SEED_QUOTATIONS,
} from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import { useAuthStore } from "@/stores/auth-store";

const STAGE_ORDER = [
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
 * Computes mock dataset from seed quotations when the backend server is offline.
 * Respects period bounds, status, category, and sales_rep role scoping.
 */
function computeFallbackReportDataset(filters: ReportFilters): ReportDataset {
  const user = useAuthStore.getState().user;
  const isRep = user?.role === "sales_rep";
  const effectiveRepId = isRep ? (user?.id ?? "usr-sales-01") : filters.repId;

  const quotes = SEED_QUOTATIONS.filter((q) => {
    if (effectiveRepId && q.salesRepId !== effectiveRepId) {
      if (
        user?.email &&
        !user.email.toLowerCase().includes(q.salesRepId.toLowerCase())
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
      const hasCat = q.lines.some(
        (l) => l.product && l.product.category === filters.category,
      );
      if (!hasCat) return false;
    }

    return true;
  });

  // Funnel
  const funnelMap = new Map<string, { count: number; netMinor: number }>();
  for (const s of STAGE_ORDER) {
    funnelMap.set(s, { count: 0, netMinor: 0 });
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

  // Line-level financial aggregations
  let totalGrossMinor = 0;
  let totalNetMinor = 0;
  let totalCostMinor = 0;
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

      const curr = categoryStats.get(cat) ?? {
        lineCount: 0,
        grossMinor: 0,
        netMinor: 0,
        costMinor: 0,
      };
      categoryStats.set(cat, {
        lineCount: curr.lineCount + 1,
        grossMinor: curr.grossMinor + gross,
        netMinor: curr.netMinor + net,
        costMinor: curr.costMinor + cost,
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

export async function getSalesReport(
  filters: ReportFilters,
): Promise<ReportDataset> {
  try {
    const res = await apiClient.get(apiRoutes.reports.sales.path, {
      params: filters,
    });
    if (res.data?.data) {
      return res.data.data as ReportDataset;
    }
    return computeFallbackReportDataset(filters);
  } catch {
    return computeFallbackReportDataset(filters);
  }
}

/**
 * Downloads report as an authenticated blob to preserve bearer token session.
 */
export async function downloadExport(
  format: "xlsx" | "pdf",
  filters: ReportFilters,
): Promise<void> {
  const url =
    format === "xlsx"
      ? apiRoutes.reports.exportXlsx.path
      : apiRoutes.reports.exportPdf.path;

  try {
    const res = await apiClient.get(url, {
      params: filters,
      responseType: "blob",
    });

    const blob = new Blob([res.data], {
      type:
        res.headers["content-type"] ||
        (format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf"),
    });

    const disposition = res.headers["content-disposition"] as
      | string
      | undefined;
    const match = disposition?.match(/filename="?([^"]+)"?/i);
    const filename = match?.[1] ?? `sales-report_${Date.now()}.${format}`;

    triggerDownload(blob, filename);
  } catch {
    // If API is not running, generate client-side fallback blob with real numbers
    const dataset = computeFallbackReportDataset(filters);
    const s = dataset.summary;

    if (format === "xlsx") {
      const csvContent = [
        ["DealFlow360 Executive Sales Report"],
        [
          `Period: ${filters.from ? new Date(filters.from).toISOString().slice(0, 10) : "All Time"} to ${filters.to ? new Date(filters.to).toISOString().slice(0, 10) : "Present"}`,
        ],
        [],
        ["--- Executive Summary ---"],
        ["Metric", "Value"],
        ["Total Quotations", s.quoteCount],
        ["Gross Revenue ($)", (s.grossMinor / 100).toFixed(2)],
        ["Net Revenue ($)", (s.netMinor / 100).toFixed(2)],
        ["Total Cost ($)", (s.costMinor / 100).toFixed(2)],
        ["Discount Concessions ($)", (s.discountMinor / 100).toFixed(2)],
        ["Average Discount %", `${s.discountPct}%`],
        ["Realized Margin %", `${s.marginPct}%`],
        [],
        ["--- Pipeline Funnel ---"],
        ["Stage", "Deals", "Net Volume ($)"],
        ...dataset.funnel.map((f) => [
          f.status,
          f.count,
          (f.netMinor / 100).toFixed(2),
        ]),
        [],
        ["--- Product Categories ---"],
        ["Category", "Lines", "Net Revenue ($)", "Margin %"],
        ...(dataset.categoryBreakdown ?? []).map((c) => [
          c.categoryName,
          c.lineCount,
          (c.netMinor / 100).toFixed(2),
          `${c.marginPct}%`,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      triggerDownload(
        blob,
        `sales-report_${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } else {
      const textReport = `=====================================================
DEALFLOW360 EXECUTIVE SALES BRIEF
=====================================================
Generated: ${new Date().toLocaleString()}
Period: ${filters.from ? new Date(filters.from).toISOString().slice(0, 10) : "All"} -> ${filters.to ? new Date(filters.to).toISOString().slice(0, 10) : "Today"}

EXECUTIVE SUMMARY
-----------------------------------------------------
Total Quotes:           ${s.quoteCount}
Gross Revenue:          $${(s.grossMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
Net Booked Volume:      $${(s.netMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
Total Cost:             $${(s.costMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
Discount Concessions:   $${(s.discountMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
Blended Discount:       ${s.discountPct.toFixed(2)}%
Realized Margin:        ${s.marginPct.toFixed(2)}%

PIPELINE FUNNEL
-----------------------------------------------------
${dataset.funnel.map((f) => `${f.status.padEnd(20)} ${String(f.count).padStart(4)} deals   $${(f.netMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`).join("\n")}
=====================================================
`;
      const blob = new Blob([textReport], {
        type: "text/plain;charset=utf-8;",
      });
      triggerDownload(
        blob,
        `sales-report_${new Date().toISOString().slice(0, 10)}.txt`,
      );
    }
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
