import { useState } from "react";
import { BarChart3, RefreshCw, ShieldCheck } from "lucide-react";
import type { ReportFilters } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import { CategoryBreakdown } from "../components/category-breakdown";
import { ExportButtons } from "../components/export-buttons";
import { FilterBar } from "../components/filter-bar";
import { FunnelTable } from "../components/funnel-table";
import { SummaryCards } from "../components/summary-cards";
import { useSalesReport } from "../hooks/use-reports";

export default function ReportsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "sales_rep";
  const canPickRep = ["sales_manager", "finance", "admin"].includes(role);

  const [filters, setFilters] = useState<ReportFilters>({});
  const { data, isLoading, isFetching, refetch } = useSalesReport(filters);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Executive Reporting & Analytics
            </h1>
            <Badge tone="neutral" className="text-xs font-mono capitalize">
              Role: {role.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            PS A7 Single Dataset reporting: real-time sales aggregations,
            pipeline funnels, discount leakage, and streaming XLSX/PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`size-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <ExportButtons filters={filters} />
        </div>
      </div>

      {/* Governance Banner for Sales Reps */}
      {!canPickRep && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <ShieldCheck className="size-4 shrink-0" />
          <span>
            <strong>Role-Based Scoping Active:</strong> You are signed in as a
            Sales Representative. Dashboard totals and downloaded reports are
            automatically scoped strictly to your managed deals.
          </span>
        </div>
      )}

      {/* Multi-Dimensional Filter Bar */}
      <FilterBar
        value={filters}
        onChange={setFilters}
        canPickRep={canPickRep}
      />

      {/* Main Content Area */}
      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Spinner size="lg" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Aggregating line-level financial telemetry...
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <SummaryCards summary={data.summary} loading={isFetching} />

          {/* Pipeline Stage Funnel */}
          <FunnelTable funnel={data.funnel} />

          {/* Category Contribution Breakdown */}
          <CategoryBreakdown categories={data.categoryBreakdown} />
        </div>
      ) : (
        <div className="surface-card rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            No quotation data found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting or resetting your date bounds and category filters.
          </p>
        </div>
      )}
    </div>
  );
}
