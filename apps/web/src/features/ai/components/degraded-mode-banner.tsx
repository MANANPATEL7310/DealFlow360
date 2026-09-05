import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { AiStatus } from "@template/shared";

interface DegradedModeBannerProps {
  status?: AiStatus | null;
  compact?: boolean;
}

export function DegradedModeBanner({
  status,
  compact = false,
}: DegradedModeBannerProps) {
  if (!status || (status.enabled && status.aiAvailable)) {
    return null;
  }

  const reason =
    status.degradedReason ??
    "AI automation is inactive. System running strictly in deterministic Document A mode.";

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
        <AlertTriangle className="size-3.5 shrink-0" />
        <span>Deterministic Fallback</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 text-xs text-foreground shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-500/20 p-1.5 text-amber-500">
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-amber-500">
            <span>Agentic AI Degraded Mode Active</span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/20 px-1.5 py-0.5 text-xs font-medium text-secondary">
              <ShieldCheck className="size-3" />
              Document A Enforced
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{reason}</p>
          <p className="text-xs text-muted-foreground/80">
            Master governance engines, discount ceiling checks, warehouse
            allocations, and billing schedules remain 100% authoritative and
            functional.
          </p>
        </div>
      </div>
    </div>
  );
}
