import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { useAiCopilotStore } from "../stores/ai-copilot-store";
import { fetchAiStatus, fetchApprovalRequests } from "../services/ai-api";

export function AiCopilotTrigger() {
  const { toggleOpen, isOpen } = useAiCopilotStore();

  // Surface AI availability + pending human-approval load right on the trigger,
  // so the agent's importance is visible without enlarging the icon.
  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["ai", "approvals"],
    queryFn: () => fetchApprovalRequests(),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 45,
  });

  const pendingCount = approvals.filter((r) => r.status === "PENDING").length;
  const isLive = Boolean(aiStatus?.enabled);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleOpen}
      type="button"
      className={`relative gap-2 overflow-hidden border text-xs font-semibold transition-all ${
        isOpen
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-primary/40 bg-background/90 text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
      }`}
      title={
        pendingCount > 0
          ? `${pendingCount} AI proposal${pendingCount === 1 ? "" : "s"} awaiting your approval`
          : "Open DealFlow AI Copilot & HITL Approvals"
      }
    >
      {!isOpen && <BorderBeam duration={7} borderWidth={1.5} />}

      <div className="relative flex items-center justify-center">
        <Sparkles className="size-3.5 text-primary animate-pulse" />
        <span
          className={`absolute -top-1 -right-1 size-1.5 rounded-full ring-2 ring-background ${
            isLive ? "bg-emerald-500" : "bg-muted-foreground/50"
          }`}
        />
      </div>

      <span className="hidden sm:inline">AI Copilot</span>

      {pendingCount > 0 && (
        <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold leading-4 text-primary-foreground tabular-nums">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </Button>
  );
}
