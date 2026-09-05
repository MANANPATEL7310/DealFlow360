import { ApprovalRulesCard } from "@/features/governance/components/approval-rules-card";
import { CategoryCeilingsCard } from "@/features/governance/components/category-ceilings-card";
import { TierCeilingsCard } from "@/features/governance/components/tier-ceilings-card";

export function GovernanceTab() {
  return (
    <div className="space-y-8">
      {/* Discount Tier Limits */}
      <section className="space-y-3">
        <TierCeilingsCard />
      </section>

      {/* Category Ceilings */}
      <section className="space-y-3">
        <CategoryCeilingsCard />
      </section>

      {/* Approval Chain Rules */}
      <section className="space-y-3">
        <ApprovalRulesCard />
      </section>
    </div>
  );
}
