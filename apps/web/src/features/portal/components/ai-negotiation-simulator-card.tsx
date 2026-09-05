import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Scale,
  Copy,
  TrendingDown,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNegotiationEvaluation,
  fetchAiStatus,
} from "@/features/ai/services/ai-api";
import { DegradedModeBanner } from "@/features/ai/components/degraded-mode-banner";
import type { NegotiationRequest, Quotation } from "@template/shared";
import toast from "react-hot-toast";

interface AiNegotiationSimulatorCardProps {
  quotation: Quotation;
  negotiation: NegotiationRequest;
  onApplyDraft: (draft: string) => void;
}

export function AiNegotiationSimulatorCard({
  quotation,
  negotiation,
  onApplyDraft,
}: AiNegotiationSimulatorCardProps) {
  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  const counterPct = negotiation.counterDiscountPct ?? 0;

  const { data: evaluation, isLoading } = useQuery({
    queryKey: [
      "ai",
      "negotiation-evaluate",
      quotation.id,
      counterPct,
      negotiation.lineId,
    ],
    queryFn: () =>
      fetchNegotiationEvaluation(quotation.id, counterPct, negotiation.lineId),
    staleTime: 1000 * 60,
    enabled: Boolean(aiStatus?.enabled && quotation.id && counterPct > 0),
  });

  if (aiStatus && !aiStatus.enabled) {
    return <DegradedModeBanner status={aiStatus} compact />;
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/80 bg-primary/5 p-4 animate-pulse space-y-2">
        <div className="h-4 w-40 rounded bg-primary/20" />
        <div className="h-10 w-full rounded bg-muted/60" />
      </div>
    );
  }

  if (!evaluation) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary/20 text-primary">
            <Sparkles className="size-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground">
            Agent 6 · Negotiation Simulator
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
            <Cpu className="size-2.5" />
            Claude 4.5
          </span>
        </div>

        {/* Governance Simulation Badge */}
        {evaluation.wouldAutoApprove ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-500">
            <ShieldCheck className="size-3" />
            Auto-Approvable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
            <ShieldAlert className="size-3" />
            Escalation Required (
            {evaluation.requiredLevelsIfAccepted.join(", ")})
          </span>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-2 text-xs">
        <div>
          <span className="text-xs text-muted-foreground uppercase">
            Client Ask
          </span>
          <p className="font-bold text-rose-500 font-mono">{counterPct}%</p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase">
            AI Recommended Counter
          </span>
          <p className="font-bold text-primary font-mono">
            {evaluation.recommendedCounterPct ?? counterPct}%
          </p>
        </div>
        <div>
          <span className="text-xs text-muted-foreground uppercase">
            Margin Impact
          </span>
          <p className="font-bold text-amber-500 font-mono flex items-center gap-1">
            <TrendingDown className="size-3" />
            {evaluation.marginImpactPct}%
          </p>
        </div>
      </div>

      {/* Rationale explanation */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {evaluation.rationale}
      </p>

      {/* AI Pre-Drafted Reply */}
      <div className="space-y-1.5 rounded-lg border border-border/80 bg-background/90 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-primary flex items-center gap-1">
            <Scale className="size-3" />
            AI Drafted Compromise Reply
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onApplyDraft(evaluation.draftMessage);
              toast.success("Draft inserted into response box");
            }}
            className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
          >
            <Copy className="size-3" />
            <span>Use AI Draft</span>
          </Button>
        </div>
        <p className="text-xs text-foreground/90 leading-normal italic whitespace-pre-wrap">
          "{evaluation.draftMessage}"
        </p>
      </div>

      {/* Guardrail Disclaimer */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <ShieldCheck className="size-3.5 text-secondary shrink-0" />
        <span>
          Human-in-the-loop: The client never receives raw AI messages. Rep
          review and approval is mandatory before sending.
        </span>
      </div>
    </div>
  );
}
