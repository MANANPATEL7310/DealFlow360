import { DollarSign, Percent, GitPullRequest, Truck } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { useDashboardSummary } from "../hooks/use-dashboard-data";

export function KpiStatsGrid() {
  const { data, isLoading } = useDashboardSummary();

  const kpis = data?.kpis;
  const pipelineDollars = kpis
    ? `$${(kpis.totalPipelineMinor / 100).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : "$0";

  const marginDisplay = kpis ? `${kpis.averageMarginPct}%` : "0%";
  const isHealthyMargin = (kpis?.averageMarginPct ?? 0) >= 30;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Pipeline Volume */}
      <MetricCard
        title="Active Pipeline"
        value={pipelineDollars}
        subvalue="Unweighted order book"
        icon={DollarSign}
        tone="primary"
        loading={isLoading}
        trend={{
          value: "+14.2%",
          label: "vs. last month",
          positive: true,
        }}
      />

      {/* 2. Blended Margin % */}
      <MetricCard
        title="Avg. Blended Margin"
        value={marginDisplay}
        subvalue={isHealthyMargin ? "Above 30% baseline threshold" : "Below target margin"}
        icon={Percent}
        tone={isHealthyMargin ? "secondary" : "warning"}
        loading={isLoading}
        trend={{
          value: isHealthyMargin ? "+2.8%" : "-1.4%",
          label: "target: 35%",
          positive: isHealthyMargin,
        }}
      />

      {/* 3. Pending Approvals */}
      <MetricCard
        title="Pending Approvals"
        value={kpis?.pendingApprovalsCount ?? 0}
        subvalue="Awaiting Manager or Finance"
        icon={GitPullRequest}
        tone={(kpis?.pendingApprovalsCount ?? 0) > 0 ? "warning" : "secondary"}
        loading={isLoading}
        trend={{
          value: "Avg 4.2h",
          label: "turnaround time",
          positive: true,
        }}
      />

      {/* 4. Active Backorders */}
      <MetricCard
        title="Warehouse Splits"
        value={kpis?.activeBackordersCount ?? 0}
        subvalue="Active inventory backorders"
        icon={Truck}
        tone={(kpis?.activeBackordersCount ?? 0) > 0 ? "danger" : "secondary"}
        loading={isLoading}
        trend={{
          value: "Multi-facility",
          label: "split routing active",
          positive: true,
        }}
      />
    </div>
  );
}

export default KpiStatsGrid;
