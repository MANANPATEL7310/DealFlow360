import { DollarSign, FileSpreadsheet, Percent, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import type { ReportDataset } from "@template/shared";

interface SummaryCardsProps {
  summary: ReportDataset["summary"];
  loading?: boolean;
}

const fmtCurrency = (minor: number) =>
  `$${(minor / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function SummaryCards({ summary, loading = false }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Net Booked Volume"
        value={fmtCurrency(summary.netMinor)}
        subvalue={`Gross: ${fmtCurrency(summary.grossMinor)}`}
        icon={DollarSign}
        tone="primary"
        loading={loading}
      />
      <MetricCard
        title="Monitored Deals"
        value={String(summary.quoteCount)}
        subvalue="Matching active period filters"
        icon={FileSpreadsheet}
        tone="neutral"
        loading={loading}
      />
      <MetricCard
        title="Weighted Discount"
        value={`${summary.discountPct.toFixed(1)}%`}
        subvalue={`Concessions: ${fmtCurrency(summary.discountMinor)}`}
        icon={Percent}
        tone={summary.discountPct > 12 ? "warning" : "secondary"}
        loading={loading}
      />
      <MetricCard
        title="Realized Margin"
        value={`${summary.marginPct.toFixed(1)}%`}
        subvalue={`COGS: ${fmtCurrency(summary.costMinor)}`}
        icon={TrendingUp}
        tone={summary.marginPct >= 35 ? "secondary" : "warning"}
        loading={loading}
      />
    </div>
  );
}
