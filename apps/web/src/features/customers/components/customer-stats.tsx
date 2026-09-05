import type { Customer } from "@template/shared";
import {
  Award,
  Building2,
  CreditCard,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface CustomerStatsProps {
  customers: Customer[];
  isLoading?: boolean;
}

export function CustomerStats({ customers, isLoading }: CustomerStatsProps) {
  const total = customers.length;
  const goldCount = customers.filter((c) => c.tier === "GOLD").length;
  const silverCount = customers.filter((c) => c.tier === "SILVER").length;
  const bronzeCount = customers.filter((c) => c.tier === "BRONZE").length;

  const totalCreditAllocatedDollars =
    customers.reduce((sum, c) => sum + c.creditLimit, 0) / 100;
  const creditMillions = (totalCreditAllocatedDollars / 1000000).toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        icon={Building2}
        loading={isLoading}
        title="Enterprise Accounts"
        value={total.toString()}
      />
      <MetricCard
        icon={Award}
        loading={isLoading}
        title="Gold Strategic Tier"
        value={goldCount.toString()}
      />
      <MetricCard
        icon={ShieldCheck}
        loading={isLoading}
        title="Silver Enterprise"
        value={silverCount.toString()}
      />
      <MetricCard
        icon={ShieldAlert}
        loading={isLoading}
        title="Bronze Growth"
        value={bronzeCount.toString()}
      />
      <MetricCard
        icon={CreditCard}
        loading={isLoading}
        title="Total Credit Lines"
        value={`$${creditMillions}M`}
      />
    </div>
  );
}
