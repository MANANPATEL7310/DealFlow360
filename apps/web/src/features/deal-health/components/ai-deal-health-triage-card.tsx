import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  ExternalLink,
  Flame,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAiDealHealthTriage,
  fetchAiStatus,
} from "@/features/ai/services/ai-api";
import { DegradedModeBanner } from "@/features/ai/components/degraded-mode-banner";
import { appRoutes } from "@template/shared";
import type {
  AiDealHealthPriority,
  AiDealHealthTriageAlert,
  CustomerTier,
  DealHealthAlert,
} from "@template/shared";

interface AiDealHealthTriageCardProps {
  onOpenNudgeModal: (alert: DealHealthAlert, prefillMessage?: string) => void;
  className?: string;
}

export function AiDealHealthTriageCard({
  onOpenNudgeModal,
  className,
}: AiDealHealthTriageCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check global AI status
  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  const isAiActive = Boolean(aiStatus?.enabled);

  // Query Agent 5 Deal Health Triage
  const {
    data: triageData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai", "deal-health-triage"],
    queryFn: fetchAiDealHealthTriage,
    enabled: isAiActive,
    staleTime: 1000 * 30,
  });

  if (aiStatus && !aiStatus.enabled) {
    return <DegradedModeBanner status={aiStatus} />;
  }

  if (isLoading) {
    return (
      <Card className="p-6 border-primary/20 bg-card/60 animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-full bg-primary/20" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </Card>
    );
  }

  if (isError || !triageData) {
    return null;
  }

  const {
    triagedAlerts = [],
    stalledDealsCount = 0,
    pipelineAtRiskMinor = 0,
    executiveSummary = "",
  } = triageData;

  const p1Count = triagedAlerts.filter(
    (a) => a.priority === "P1_CRITICAL",
  ).length;

  const getPriorityBadge = (priority: AiDealHealthPriority) => {
    switch (priority) {
      case "P1_CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-rose-500 border border-rose-500/20">
            <Flame className="size-3" /> P1 CRITICAL
          </span>
        );
      case "P2_ELEVATED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-500 border border-amber-500/20">
            <AlertTriangle className="size-3" /> P2 ELEVATED
          </span>
        );
      case "P3_WATCH":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-500 border border-blue-500/20">
            <Clock className="size-3" /> P3 WATCH
          </span>
        );
    }
  };

  const handleLaunchNudge = (item: AiDealHealthTriageAlert) => {
    // Construct a synthetic DealHealthAlert object for modal consumption
    const alertObj: DealHealthAlert = {
      id: item.alertId,
      quotationId: item.quotationId,
      quotationCode: item.quotationCode,
      customerName: item.customerName,
      customerTier: item.customerTier as CustomerTier,
      salesRepName: "Account Representative",
      type: "STALLED",
      severity: item.priority === "P1_CRITICAL" ? "critical" : "high",
      title: item.suggestedAction,
      detail: item.whySummary,
      metrics: { atRiskAmountMinor: 100000 },
      recommendedAction: item.suggestedAction,
      status: "open",
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolutionNote: null,
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onOpenNudgeModal(alertObj, item.draftNudgeMessage);
  };

  return (
    <Card
      className={`overflow-hidden rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-card/95 to-card p-6 shadow-sm backdrop-blur-xs space-y-5 ${className ?? ""}`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-xs">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                Agent 5 · AI Deal Health Monitor & Recovery Assistant
              </h2>
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                <Cpu className="size-2.5" />
                Claude 4.5
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Autonomous velocity triage, stagnation diagnosis, and personalized
              buyer recovery drafts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh Telemetry</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="size-8 rounded-lg p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand radar" : "Collapse radar"}
          >
            {isCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <Flame className="size-4" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Pipeline at Risk
            </span>
            <div className="font-mono text-base font-bold text-rose-500">
              $
              {(pipelineAtRiskMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <Clock className="size-4" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Stalled Pipelines
            </span>
            <div className="font-mono text-base font-bold text-amber-500">
              {stalledDealsCount} Stagnant Deals
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Urgent Interventions
            </span>
            <div className="font-mono text-base font-bold text-primary">
              {p1Count} Priority P1 Deals
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary Rationale */}
      <div className="rounded-xl border border-border/80 bg-background/80 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Executive Telemetry & Recovery Rationale</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {executiveSummary}
        </p>
      </div>

      {/* Prioritized Deal Stream */}
      {!isCollapsed && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span>Prioritized Recovery Queue ({triagedAlerts.length})</span>
            <span className="text-muted-foreground font-normal">
              Autonomous diagnosis & pre-drafted copy
            </span>
          </div>

          <div className="space-y-3">
            {triagedAlerts.map((item) => (
              <div
                key={item.alertId}
                className="surface-card flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-background/80 p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(item.priority)}
                    <Link
                      to={appRoutes.quotationBuilder(item.quotationId)}
                      className="font-mono font-bold text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {item.quotationCode}
                      <ExternalLink className="size-3" />
                    </Link>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-bold text-foreground">
                      {item.customerName}
                    </span>
                    <Badge tone="neutral" className="text-xs">
                      {item.customerTier}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono text-xs font-semibold text-rose-500">
                      Risk: {item.escalationRiskScore}/100
                    </span>
                  </div>
                </div>

                {/* Narrative Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.whySummary}
                </p>

                {/* Pre-drafted Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="size-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">
                      {item.suggestedAction}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleLaunchNudge(item)}
                    className="h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs"
                  >
                    <Send className="size-3.5" />
                    <span>Review & Dispatch Nudge</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* HITL Notice Footer */}
          <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span>
              <strong>HITL Compliance:</strong> Sales reps review, refine, and
              authorize every outward message. Dispatched nudges record full
              audit snapshots in compliance logs.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
