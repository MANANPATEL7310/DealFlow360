import type { Quotation } from "@template/shared";
import { AlertTriangle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface QuotationsStatsProps {
  quotations: Quotation[];
  isLoading?: boolean;
}

export function QuotationsStats({
  quotations,
  isLoading,
}: QuotationsStatsProps) {
  const activeQuotes = quotations.filter((q) => q.status !== "REJECTED");
  const totalPipelineDollars =
    activeQuotes.reduce((sum, q) => sum + q.grandTotalMinor, 0) / 100;
  const pipelineMillions = (totalPipelineDollars / 1000).toFixed(1);

  const draftsCount = quotations.filter((q) => q.status === "DRAFT").length;
  const pendingCount = quotations.filter(
    (q) => q.status === "PENDING_APPROVAL",
  ).length;

  const validMarginQuotes = quotations.filter(
    (q) => (q.lines?.length ?? q._count?.lines ?? 0) > 0,
  );
  const avgMargin =
    validMarginQuotes.length > 0
      ? (
          validMarginQuotes.reduce((sum, q) => sum + q.marginPct, 0) /
          validMarginQuotes.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        icon={DollarSign}
        loading={isLoading}
        title="Active Pipeline Value"
        value={`$${pipelineMillions}k`}
      />
      <MetricCard
        icon={Clock}
        loading={isLoading}
        title="Draft Quotes"
        value={draftsCount.toString()}
      />
      <MetricCard
        icon={AlertTriangle}
        loading={isLoading}
        title="Pending Escalations"
        value={pendingCount.toString()}
      />
      <MetricCard
        icon={TrendingUp}
        loading={isLoading}
        title="Average Deal Margin"
        value={`${avgMargin}%`}
      />
    </div>
  );
}
