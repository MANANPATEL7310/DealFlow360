import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAiCopilotStore } from "../stores/ai-copilot-store";
import { fetchApprovalRequests, fetchAiStatus } from "../services/ai-api";

export function AiCopilotTrigger() {
  const { toggleOpen, isOpen } = useAiCopilotStore();

  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ["ai", "approvals", "PENDING"],
    queryFn: () => fetchApprovalRequests("PENDING"),
    staleTime: 1000 * 15,
  });

  const pendingCount = pendingApprovals.length;
  const isAiActive = aiStatus?.enabled ?? true;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleOpen}
      className={`relative gap-2 border text-xs font-semibold transition-all ${
        isOpen
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-primary/40 bg-background/90 text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
      }`}
      title="Open DealFlow AI Copilot & HITL Approvals"
    >
      <div className="relative flex items-center justify-center">
        <Sparkles className="size-3.5 text-primary animate-pulse" />
        {isAiActive && (
          <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </div>

      <span className="hidden sm:inline">AI Copilot</span>

      {pendingCount > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-xs font-bold text-primary-foreground">
          {pendingCount}
        </span>
      )}
    </Button>
  );
}
