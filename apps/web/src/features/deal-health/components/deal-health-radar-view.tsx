import { Activity, Layers, Percent, ShieldCheck } from "lucide-react";
import type {
  DealHealthScore,
  DealHealthSummary,
  HealthCategory,
} from "@template/shared";

interface DealHealthRadarViewProps {
  summary: DealHealthSummary;
  scores: DealHealthScore[];
  selectedCategory: HealthCategory | "ALL";
  onSelectCategory: (category: HealthCategory | "ALL") => void;
}

export function DealHealthRadarView({
  summary,
  scores,
  selectedCategory,
  onSelectCategory,
}: DealHealthRadarViewProps) {
  const total = summary.monitoredDealsCount || 1;

  const healthyPct = Math.round((summary.healthyDealsCount / total) * 100);
  const watchPct = Math.round((summary.watchDealsCount / total) * 100);
  const atRiskPct = Math.round((summary.atRiskDealsCount / total) * 100);
  const criticalPct = Math.round((summary.criticalDealsCount / total) * 100);

  // Calculate average factor scores across all monitored quotations
  const avgMargin = Math.round(
    scores.reduce((sum, s) => sum + s.factors.marginHealth, 0) /
      (scores.length || 1),
  );
  const avgVelocity = Math.round(
    scores.reduce((sum, s) => sum + s.factors.velocityHealth, 0) /
      (scores.length || 1),
  );
  const avgFulfillment = Math.round(
    scores.reduce((sum, s) => sum + s.factors.fulfillmentHealth, 0) /
      (scores.length || 1),
  );
  const avgDiscount = Math.round(
    scores.reduce((sum, s) => sum + s.factors.discountCompliance, 0) /
      (scores.length || 1),
  );

  return (
    <div className="surface-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Activity className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Deal Health Radar & Risk Distribution
              </h2>
              <p className="text-xs text-muted-foreground">
                Continuous deterministic monitoring across margin, velocity,
                stock, and discount metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Global Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectCategory("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === "ALL"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Deals ({summary.monitoredDealsCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory("CRITICAL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedCategory === "CRITICAL"
                ? "bg-danger text-white shadow-sm"
                : "bg-danger/10 text-danger hover:bg-danger/20"
            }`}
          >
            <span>Critical</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-mono">
              {summary.criticalDealsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory("AT_RISK")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedCategory === "AT_RISK"
                ? "bg-warning text-white shadow-sm"
                : "bg-warning/10 text-warning hover:bg-warning/20"
            }`}
          >
            <span>At Risk</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-mono">
              {summary.atRiskDealsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory("WATCH")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedCategory === "WATCH"
                ? "bg-primary/80 text-white shadow-sm"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            <span>Watch</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-mono">
              {summary.watchDealsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelectCategory("HEALTHY")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedCategory === "HEALTHY"
                ? "bg-success text-white shadow-sm"
                : "bg-success/10 text-success hover:bg-success/20"
            }`}
          >
            <span>Healthy</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-mono">
              {summary.healthyDealsCount}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-12 items-center">
        {/* Left: Health Band Spectrum Bar (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>Pipeline Health Distribution Spectrum</span>
              <span className="text-muted-foreground">
                {summary.monitoredDealsCount} Active Opportunities
              </span>
            </div>

            {/* Stacked percentage bar */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-surface-muted p-0.5 ring-1 ring-border">
              {criticalPct > 0 && (
                <div
                  style={{ width: `${criticalPct}%` }}
                  className="h-full bg-danger transition-all first:rounded-l-full last:rounded-r-full"
                  title={`Critical: ${summary.criticalDealsCount} deals (${criticalPct}%)`}
                />
              )}
              {atRiskPct > 0 && (
                <div
                  style={{ width: `${atRiskPct}%` }}
                  className="h-full bg-warning transition-all first:rounded-l-full last:rounded-r-full"
                  title={`At Risk: ${summary.atRiskDealsCount} deals (${atRiskPct}%)`}
                />
              )}
              {watchPct > 0 && (
                <div
                  style={{ width: `${watchPct}%` }}
                  className="h-full bg-primary/70 transition-all first:rounded-l-full last:rounded-r-full"
                  title={`Watch: ${summary.watchDealsCount} deals (${watchPct}%)`}
                />
              )}
              {healthyPct > 0 && (
                <div
                  style={{ width: `${healthyPct}%` }}
                  className="h-full bg-success transition-all first:rounded-l-full last:rounded-r-full"
                  title={`Healthy: ${summary.healthyDealsCount} deals (${healthyPct}%)`}
                />
              )}
            </div>
          </div>

          {/* Quadrant breakdown grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-danger font-semibold">
                <span>Critical</span>
                <span className="font-mono text-sm">
                  {summary.criticalDealsCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Score 0 – 44</p>
            </div>

            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-warning font-semibold">
                <span>At Risk</span>
                <span className="font-mono text-sm">
                  {summary.atRiskDealsCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Score 45 – 64</p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-primary font-semibold">
                <span>Watch</span>
                <span className="font-mono text-sm">
                  {summary.watchDealsCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Score 65 – 79</p>
            </div>

            <div className="rounded-xl border border-success/20 bg-success/5 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-success font-semibold">
                <span>Healthy</span>
                <span className="font-mono text-sm">
                  {summary.healthyDealsCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Score 80 – 100</p>
            </div>
          </div>
        </div>

        {/* Right: Factor Health Gauges (5 cols) */}
        <div className="rounded-xl border border-border bg-surface-muted/30 p-4 space-y-3 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-foreground">
              Composite Dimension Averages
            </span>
            <span className="text-xs text-muted-foreground">
              PS B9 Algorithm
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Factor 1: Margin */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="size-3 text-primary" /> Margin Viability
                  (35% wt)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {avgMargin}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                <div
                  style={{ width: `${avgMargin}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>

            {/* Factor 2: Velocity */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Activity className="size-3 text-warning" /> Pipeline Velocity
                  (25% wt)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {avgVelocity}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                <div
                  style={{ width: `${avgVelocity}%` }}
                  className="h-full bg-warning rounded-full"
                />
              </div>
            </div>

            {/* Factor 3: Fulfillment */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Layers className="size-3 text-emerald-500" /> Stock
                  Feasibility (20% wt)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {avgFulfillment}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                <div
                  style={{ width: `${avgFulfillment}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Factor 4: Discount */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="size-3 text-primary" /> Tier
                  Compliance (20% wt)
                </span>
                <span className="font-mono font-bold text-foreground">
                  {avgDiscount}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                <div
                  style={{ width: `${avgDiscount}%` }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
