import { PieChart } from "lucide-react";
import { DonutChart } from "@/components/ui/charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "../hooks/use-dashboard-data";

const STAGE_META: {
  key: keyof PipelineStages;
  label: string;
  color: string;
}[] = [
  { key: "draft", label: "Drafting", color: "var(--muted-foreground)" },
  { key: "pendingApproval", label: "Approval Gate", color: "#f59e0b" },
  { key: "approved", label: "Approved", color: "var(--primary)" },
  { key: "sent", label: "Sent to Client", color: "#0ea5e9" },
  { key: "underNegotiation", label: "Negotiation", color: "var(--secondary)" },
  { key: "confirmed", label: "Confirmed", color: "#10b981" },
];

interface PipelineStages {
  draft: number;
  pendingApproval: number;
  approved: number;
  sent: number;
  underNegotiation: number;
  confirmed: number;
}

export function PipelineDistributionChart() {
  const { data, isLoading } = useDashboardSummary();
  const stages = data?.stages;

  if (isLoading) {
    return (
      <div className="surface-card rounded-2xl border border-border p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!stages) return null;

  const slices = STAGE_META.map((meta) => ({
    label: meta.label,
    value: stages[meta.key] ?? 0,
    color: meta.color,
  })).filter((s) => s.value > 0);

  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="surface-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
          <PieChart className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Live Pipeline Distribution
          </h3>
          <p className="text-xs text-muted-foreground">
            Active quotations by lifecycle stage, straight from the database.
          </p>
        </div>
      </div>
      {total > 0 ? (
        <DonutChart
          data={slices}
          centerLabel={String(total)}
          centerSublabel="deals"
        />
      ) : (
        <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
          No active quotations in the pipeline yet.
        </div>
      )}
    </div>
  );
}

export default PipelineDistributionChart;
