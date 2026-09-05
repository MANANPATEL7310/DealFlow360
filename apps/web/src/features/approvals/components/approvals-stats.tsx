import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Inbox,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import type { ApprovalQueueItem } from "@/features/approvals/api/approvals-api";

interface ApprovalsStatsProps {
  items: ApprovalQueueItem[];
  isLoading?: boolean;
}

export function ApprovalsStats({ items, isLoading }: ApprovalsStatsProps) {
  const totalQueueCount = items.length;
  const actionableCount = items.filter((item) => item.canReview).length;
  const highRiskCount = items.filter(
    (item) => (item.quotation.blendedRiskScore ?? 0) >= 70,
  ).length;

  const totalValueDollars =
    items.reduce((acc, item) => acc + item.quotation.grandTotalMinor, 0) / 100;
  const valueFormatted =
    totalValueDollars >= 1000
      ? `$${(totalValueDollars / 1000).toFixed(1)}k`
      : `$${totalValueDollars.toFixed(0)}`;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        icon={Inbox}
        loading={isLoading}
        title="Pending In Queue"
        value={totalQueueCount.toString()}
      />
      <MetricCard
        icon={CheckCircle2}
        loading={isLoading}
        title="Actionable By You"
        value={actionableCount.toString()}
      />
      <MetricCard
        icon={AlertTriangle}
        loading={isLoading}
        title="High Risk Deals"
        value={highRiskCount.toString()}
      />
      <MetricCard
        icon={DollarSign}
        loading={isLoading}
        title="Escalated Pipeline"
        value={valueFormatted}
      />
    </div>
  );
}
