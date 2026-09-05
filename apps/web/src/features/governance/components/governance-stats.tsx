import type {
  ApprovalChainRule,
  CategoryDiscountCeiling,
  DiscountTierCeiling,
} from "@template/shared";
import { CheckCircle2, GitPullRequest, Layers, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface GovernanceStatsProps {
  tiers?: DiscountTierCeiling[];
  ceilings?: CategoryDiscountCeiling[];
  rules?: ApprovalChainRule[];
  isLoading?: boolean;
}

export function GovernanceStats({
  tiers = [],
  ceilings = [],
  rules = [],
  isLoading,
}: GovernanceStatsProps) {
  const goldTier = tiers.find((t) => t.customerTier === "GOLD");
  const goldCeilingPct = goldTier ? `${goldTier.maxDiscountPct}%` : "15.0%";

  const hardwareCeiling = ceilings.find((c) => c.category === "HARDWARE");
  const hardwareCeilingPct = hardwareCeiling
    ? `${hardwareCeiling.maxDiscountPct}%`
    : "15.0%";

  const activeRulesCount = rules.length.toString();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        icon={ShieldCheck}
        loading={isLoading}
        title="Gold Strategic Ceiling"
        value={goldCeilingPct}
      />
      <MetricCard
        icon={Layers}
        loading={isLoading}
        title="Hardware Cap"
        value={hardwareCeilingPct}
      />
      <MetricCard
        icon={GitPullRequest}
        loading={isLoading}
        title="Approval Chain Bands"
        value={activeRulesCount}
      />
      <MetricCard
        icon={CheckCircle2}
        loading={isLoading}
        title="Auto-Approve Baseline"
        value="0.00 Risk"
      />
    </div>
  );
}
