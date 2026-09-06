import { PieChart, TrendingUp } from "lucide-react";
import type {
  ReportCategoryContribution,
  ReportFunnelStage,
} from "@template/shared";
import { BarChart, DonutChart } from "@/components/ui/charts";

interface ReportChartsProps {
  funnel: ReportFunnelStage[];
  categories?: ReportCategoryContribution[];
}

const STAGE_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending",
  APPROVED: "Approved",
  SENT: "Sent",
  UNDER_NEGOTIATION: "Negotiation",
  CONFIRMED: "Confirmed",
  FULFILLMENT: "Fulfillment",
  BILLING: "Billing",
  PAID: "Paid",
  REJECTED: "Rejected",
};

const fmtCurrency = (minor: number) => {
  const major = minor / 100;
  if (major >= 1000) return `$${(major / 1000).toFixed(1)}k`;
  return `$${major.toFixed(0)}`;
};

export function ReportCharts({ funnel, categories = [] }: ReportChartsProps) {
  const funnelData = funnel.map((stage) => ({
    label: STAGE_LABELS[stage.status] ?? stage.status,
    value: stage.netMinor,
  }));

  const categoryData = categories.map((cat) => ({
    label: cat.categoryName,
    value: cat.netMinor,
  }));

  const totalNet = categories.reduce((sum, c) => sum + c.netMinor, 0);

  if (funnel.length === 0 && categories.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Pipeline value by stage */}
      <div className="surface-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Pipeline Value by Stage
            </h3>
            <p className="text-xs text-muted-foreground">
              Net deal value distributed across the live funnel.
            </p>
          </div>
        </div>
        <BarChart data={funnelData} formatValue={fmtCurrency} />
      </div>

      {/* Category revenue mix */}
      <div className="surface-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-secondary/10 p-1.5 text-secondary">
            <PieChart className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Revenue Mix by Category
            </h3>
            <p className="text-xs text-muted-foreground">
              Net revenue contribution across product lines.
            </p>
          </div>
        </div>
        {categoryData.length > 0 ? (
          <DonutChart
            data={categoryData}
            centerLabel={fmtCurrency(totalNet)}
            centerSublabel="Net total"
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
            No category data for the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportCharts;
