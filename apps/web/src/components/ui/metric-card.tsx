import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";

export interface MetricTrend {
  value: string | number;
  label: string;
  positive?: boolean;
}

export type MetricTone =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "neutral";

export interface MetricCardProps {
  title: string;
  value: ReactNode;
  subvalue?: ReactNode;
  icon: LucideIcon;
  trend?: MetricTrend;
  tone?: MetricTone;
  loading?: boolean;
  className?: string;
}

const toneStyles: Record<MetricTone, { iconBg: string; iconColor: string }> = {
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  secondary: {
    iconBg: "bg-secondary/10",
    iconColor: "text-secondary",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  danger: {
    iconBg: "bg-danger/10",
    iconColor: "text-danger",
  },
  neutral: {
    iconBg: "bg-surface-muted",
    iconColor: "text-muted-foreground",
  },
};

export function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  trend,
  tone = "primary",
  loading = false,
  className,
}: MetricCardProps) {
  const currentTone = toneStyles[tone];

  if (loading) {
    return (
      <div className={cn("surface-card space-y-3 p-5", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "surface-card p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </p>
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg transition-colors",
            currentTone.iconBg,
            currentTone.iconColor,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        {subvalue && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subvalue}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2 text-xs">
          <span
            className={cn(
              "flex items-center gap-0.5 font-semibold",
              trend.positive ? "text-secondary" : "text-danger",
            )}
          >
            {trend.positive ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {trend.value}
          </span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default MetricCard;
