import { Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RoleGuard } from "@/features/auth/routes/role-guard";
import { ApprovalRulesCard } from "@/features/governance/components/approval-rules-card";
import { CategoryCeilingsCard } from "@/features/governance/components/category-ceilings-card";
import { DiscountSimulatorBench } from "@/features/governance/components/discount-simulator-bench";
import { GovernanceStats } from "@/features/governance/components/governance-stats";
import { TierCeilingsCard } from "@/features/governance/components/tier-ceilings-card";
import {
  useApprovalRules,
  useCategoryCeilings,
  useDiscountTiers,
} from "@/features/governance/hooks/use-governance";

export function GovernancePage() {
  const { data: tiers, isLoading: tiersLoading } = useDiscountTiers();
  const { data: ceilings, isLoading: ceilingsLoading } = useCategoryCeilings();
  const { data: rules, isLoading: rulesLoading } = useApprovalRules();

  const isStatsLoading = tiersLoading || ceilingsLoading || rulesLoading;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Shield className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Discount governance
              </h1>
              <Badge tone="primary">Admin only</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Set tier discount limits, category margin ceilings, and approval
              escalation rules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Rules active
            </span>
          </div>
        </div>

        {/* Metric KPI Grid */}
        <GovernanceStats
          ceilings={ceilings}
          isLoading={isStatsLoading}
          rules={rules}
          tiers={tiers}
        />

        {/* Main Grid: Tier Ceilings & Category Ceilings */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <TierCeilingsCard />
          <CategoryCeilingsCard />
        </div>

        {/* Approval Chain Rules Table */}
        <ApprovalRulesCard />

        {/* Discount Simulator */}
        <DiscountSimulatorBench />
      </div>
    </RoleGuard>
  );
}
