import {
  AlertTriangle,
  Clock,
  DollarSign,
  PackageX,
} from "lucide-react";
import type { DealHealthSummary } from "@template/shared";
import { MetricCard } from "@/components/ui/metric-card";

interface DealHealthKpiGridProps {
  summary: DealHealthSummary;
}

export function DealHealthKpiGrid({ summary }: DealHealthKpiGridProps) {
  const formattedAtRiskValue = (
    summary.totalAtRiskValueMinor / 100
  ).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const criticalAndAtRiskCount = summary.criticalDealsCount + summary.atRiskDealsCount;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* At-Risk Pipeline Exposure */}
      <MetricCard
        title="At-Risk Pipeline Exposure"
        value={`$${formattedAtRiskValue}`}
        icon={DollarSign}
        subvalue={`${criticalAndAtRiskCount} deals below healthy 80-point threshold`}
        tone={summary.criticalDealsCount > 0 ? "danger" : "warning"}
        trend={
          summary.criticalDealsCount > 0
            ? { value: `${summary.criticalDealsCount}`, label: "Critical", positive: false }
            : undefined
        }
      />

      {/* Active Anomaly Alerts */}
      <MetricCard
        title="Active Anomaly Alerts"
        value={summary.openAlertsCount.toString()}
        icon={AlertTriangle}
        subvalue={`${summary.anomaliesByType.DISCOUNT_ANOMALY || 0} discount, ${summary.anomaliesByType.MARGIN_EROSION || 0} margin`}
        tone={summary.openAlertsCount > 2 ? "danger" : "warning"}
      />

      {/* Stalled Opportunities */}
      <MetricCard
        title="Stalled Opportunities (>14d)"
        value={(summary.anomaliesByType.STALLED || 0).toString()}
        icon={Clock}
        subvalue="Non-terminal quotes idle without touchpoints"
        tone={(summary.anomaliesByType.STALLED || 0) > 0 ? "warning" : "secondary"}
      />

      {/* Warehouse Stock Bottlenecks */}
      <MetricCard
        title="Fulfillment Bottlenecks"
        value={(summary.anomaliesByType.DELIVERY_SLIPPAGE || 0).toString()}
        icon={PackageX}
        subvalue="Physical stock shortages threatening promise dates"
        tone={(summary.anomaliesByType.DELIVERY_SLIPPAGE || 0) > 0 ? "danger" : "primary"}
      />
    </div>
  );
}
