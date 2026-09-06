import { cn } from "@/lib/cn";

export interface BarDatum {
  label: string;
  value: number;
  /** Optional secondary value drawn as a lighter overlay (e.g. gross vs net). */
  secondaryValue?: number;
  color?: string;
}

interface BarChartProps {
  data: BarDatum[];
  /** Format a raw value for axis/tooltip display. */
  formatValue?: (value: number) => string;
  height?: number;
  className?: string;
  /** Horizontal (default) draws labelled rows; good for categories. */
  orientation?: "horizontal" | "vertical";
}

/**
 * Dependency-free bar chart. Bars are sized as a fraction of the max value in
 * the dataset, so it scales to whatever the DB returns.
 */
export function BarChart({
  data,
  formatValue = (v) => v.toLocaleString(),
  height = 220,
  className,
  orientation = "horizontal",
}: BarChartProps) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.value, d.secondaryValue ?? 0)),
  );

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        No data available for the current filters.
      </div>
    );
  }

  if (orientation === "horizontal") {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const secPct =
            d.secondaryValue != null ? (d.secondaryValue / max) * 100 : null;
          return (
            <div key={`${d.label}-${i}`} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate font-medium text-foreground">
                  {d.label}
                </span>
                <span className="ml-3 shrink-0 font-mono font-semibold text-foreground tabular-nums">
                  {formatValue(d.value)}
                </span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                {secPct != null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                    style={{ width: `${secPct}%` }}
                  />
                )}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: d.color ?? "var(--primary)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical columns
  return (
    <div className={cn("flex items-end gap-2", className)} style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div
            key={`${d.label}-${i}`}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
              {formatValue(d.value)}
            </span>
            <div
              className="w-full max-w-10 rounded-t-md transition-all duration-500"
              style={{
                height: `${pct}%`,
                minHeight: d.value > 0 ? 4 : 0,
                backgroundColor: d.color ?? "var(--primary)",
              }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
            <span className="w-full truncate text-center text-xs text-muted-foreground">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default BarChart;
