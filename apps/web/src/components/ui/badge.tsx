import type { PropsWithChildren } from "react";
import { cn } from "@/lib/cn";

const toneMap = {
  primary: "border-primary/15 bg-primary-light/20 text-primary-dark",
  secondary: "border-secondary/15 bg-secondary-light/20 text-secondary-dark",
  success: "border-success/15 bg-success-light/20 text-success-dark",
  warning: "border-warning/15 bg-warning-light/20 text-warning-dark",
  danger: "border-danger/15 bg-danger-light/20 text-danger-dark",
  neutral: "border-neutral/15 bg-surface-muted text-neutral",
} as const;

type BadgeTone = keyof typeof toneMap;

export function Badge({
  children,
  tone = "neutral",
  className,
}: PropsWithChildren<{ tone?: BadgeTone; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
