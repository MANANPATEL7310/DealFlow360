import { useId } from "react";
import { cn } from "@/lib/cn";

export interface DonutSlice {
  label: string;
  value: number;
  /** CSS color (e.g. var(--primary) or #hex). Falls back to the palette. */
  color?: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Text rendered in the center (e.g. a total). */
  centerLabel?: string;
  centerSublabel?: string;
  className?: string;
}

const PALETTE = [
  "var(--primary)",
  "var(--secondary)",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
];

/**
 * Dependency-free donut chart driven entirely by the passed data. Renders
 * proportional arcs using stroke-dasharray on concentric circles.
 */
export function DonutChart({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  centerSublabel,
  className,
}: DonutChartProps) {
  const gradientId = useId();
  const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offsetAccum = 0;

  return (
    <div className={cn("flex items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Donut chart"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth={thickness}
            opacity={0.4}
          />
          {total > 0 &&
            data.map((slice, i) => {
              const value = Math.max(0, slice.value);
              const fraction = value / total;
              const dash = fraction * circumference;
              const color = slice.color ?? PALETTE[i % PALETTE.length];
              const el = (
                <circle
                  key={`${gradientId}-${slice.label}`}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offsetAccum}
                  strokeLinecap="butt"
                  transform={`rotate(-90 ${center} ${center})`}
                  className="transition-all duration-500"
                >
                  <title>
                    {slice.label}: {value} ({(fraction * 100).toFixed(1)}%)
                  </title>
                </circle>
              );
              offsetAccum += dash;
              return el;
            })}
        </svg>
        {(centerLabel || centerSublabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && (
              <span className="text-lg font-bold text-foreground tabular-nums">
                {centerLabel}
              </span>
            )}
            {centerSublabel && (
              <span className="text-xs text-muted-foreground">
                {centerSublabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <ul className="min-w-0 flex-1 space-y-1.5 text-xs">
        {data.map((slice, i) => {
          const value = Math.max(0, slice.value);
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <li
              key={`legend-${slice.label}`}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{
                    backgroundColor: slice.color ?? PALETTE[i % PALETTE.length],
                  }}
                />
                <span className="truncate text-muted-foreground">
                  {slice.label}
                </span>
              </span>
              <span className="shrink-0 font-mono font-semibold text-foreground tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DonutChart;
