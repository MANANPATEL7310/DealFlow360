import type { BillingSchedule } from "@template/shared";
import { paidMinor, remainingMinor } from "@template/shared";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Repeat,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

interface BillingStatsProps {
  schedule: BillingSchedule | null;
  isLoading?: boolean;
}

export function BillingStats({ schedule, isLoading }: BillingStatsProps) {
  const invoices = schedule?.invoices ?? [];
  const nonVoid = invoices.filter((i) => i.status !== "VOID");

  const totalInvoicedMinor = nonVoid.reduce((sum, i) => sum + i.amountMinor, 0);
  const totalPaidMinor = nonVoid.reduce((sum, i) => sum + paidMinor(i), 0);
  const totalDueMinor = nonVoid
    .filter((i) => i.status === "ISSUED")
    .reduce((sum, i) => sum + remainingMinor(i), 0);

  const recurringCount = new Set(
    nonVoid.filter((i) => i.kind === "RECURRING").map((i) => i.lineId),
  ).size;

  const totalInvoicedFormatted = `$${(totalInvoicedMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const totalPaidFormatted = `$${(totalPaidMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const totalDueFormatted = `$${(totalDueMinor / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <MetricCard
        icon={DollarSign}
        loading={isLoading}
        title="Total Invoiced"
        value={totalInvoicedFormatted}
      />
      <MetricCard
        icon={CheckCircle2}
        loading={isLoading}
        title="Cash Collected"
        value={totalPaidFormatted}
      />
      <MetricCard
        icon={Clock}
        loading={isLoading}
        title="Outstanding Due"
        value={totalDueFormatted}
      />
      <MetricCard
        icon={recurringCount > 0 ? Repeat : CreditCard}
        loading={isLoading}
        title="Active Subscriptions"
        value={
          recurringCount > 0
            ? `${recurringCount} Line${recurringCount > 1 ? "s" : ""}`
            : "One-Time Only"
        }
      />
    </div>
  );
}
