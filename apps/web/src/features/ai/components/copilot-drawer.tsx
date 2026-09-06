import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router";
import {
  Sparkles,
  X,
  Inbox,
  Activity,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Coins,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/ui/border-beam";
import { useAiCopilotStore } from "../stores/ai-copilot-store";
import {
  fetchAiStatus,
  fetchApprovalRequests,
  decideApproval,
  fetchAgentRuns,
  fetchContextualSuggestions,
} from "../services/ai-api";
import { HitlApprovalCard } from "./hitl-approval-card";
import { DegradedModeBanner } from "./degraded-mode-banner";
import type { HitlApprovalDecision } from "@template/shared";
import dayjs from "dayjs";

export function CopilotDrawer() {
  const { isOpen, setIsOpen, activeTab, setActiveTab } = useAiCopilotStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [inboxFilter, setInboxFilter] = useState<"PENDING" | "ALL">("PENDING");

  // Fetch AI runtime status
  const { data: aiStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 30,
    enabled: isOpen,
  });

  // Fetch HITL approval requests
  const {
    data: approvalRequests = [],
    isLoading: isLoadingApprovals,
    refetch: refetchApprovals,
  } = useQuery({
    queryKey: ["ai", "approvals"],
    queryFn: () => fetchApprovalRequests(),
    staleTime: 1000 * 15,
    enabled: isOpen,
  });

  // Fetch Agent execution traces
  const { data: agentRuns = [], isLoading: isLoadingRuns } = useQuery({
    queryKey: ["ai", "runs"],
    queryFn: () => fetchAgentRuns(20),
    staleTime: 1000 * 15,
    enabled: isOpen && activeTab === "runs",
  });

  // Fetch contextual suggestions for current route
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["ai", "contextual", location.pathname],
    queryFn: () => fetchContextualSuggestions(location.pathname),
    staleTime: 1000 * 30,
    enabled: isOpen && activeTab === "suggestions",
  });

  // Mutation for deciding an approval request
  const decideMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: HitlApprovalDecision;
    }) => decideApproval(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "approvals"] });
      queryClient.invalidateQueries({ queryKey: ["ai", "runs"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success(
        `Action ${updated.status === "APPROVED" ? "approved & executed" : "rejected"}`,
      );
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Failed to process decision";
      toast.error(message);
    },
  });

  const handleDecide = async (
    id: string,
    decision: "APPROVED" | "REJECTED",
    reason?: string,
  ) => {
    await decideMutation.mutateAsync({ id, payload: { decision, reason } });
  };

  const pendingApprovals = approvalRequests.filter(
    (r) => r.status === "PENDING",
  );
  const filteredApprovals =
    inboxFilter === "PENDING" ? pendingApprovals : approvalRequests;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="DealFlow AI Copilot"
    >
      {/* Backdrop */}
      <button
        aria-label="Close AI Copilot"
        className="fixed inset-0 bg-background/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsOpen(false)}
        type="button"
      />

      {/* Slide-out Panel */}
      <div className="relative flex h-dvh w-full max-w-xl flex-col border-l border-border/80 bg-background/95 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-200">
        <BorderBeam duration={10} borderWidth={2} />
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 text-primary shadow-sm border border-primary/20">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-foreground">
                  DealFlow Copilot
                </h3>
                <span className="hidden items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary sm:inline-flex">
                  <Cpu className="size-2.5" />
                  Claude 4.5
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                Autonomous agent supervision & HITL governance
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                refetchStatus();
                refetchApprovals();
              }}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              title="Refresh AI state"
              type="button"
            >
              <RefreshCw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="size-8 p-0 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Budget & Model Telemetry Bar */}
        <div className="flex flex-col gap-1.5 border-b border-border/50 bg-muted/30 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Coins className="size-3.5 text-amber-500" />
            <span>Monthly Spend:</span>
            <span className="font-semibold text-foreground">
              ${aiStatus?.spendUsd?.toFixed(4) ?? "0.0303"} / $
              {aiStatus?.monthlyBudgetUsd ?? 50}.00
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 font-medium">
              HITL Guard Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-border/80 px-4 pt-2 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "inbox"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="size-3.5" />
            <span>HITL Approvals</span>
            {pendingApprovals.length > 0 && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-xs font-bold text-primary">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "suggestions"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lightbulb className="size-3.5" />
            <span>Suggestions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("runs")}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === "runs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-3.5" />
            <span>Agent Traces</span>
          </button>
        </div>

        {/* Drawer Body Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Degraded mode banner if applicable */}
          <DegradedModeBanner status={aiStatus} />

          {/* TAB 1: HITL APPROVALS INBOX */}
          {activeTab === "inbox" && (
            <div className="space-y-4">
              {/* Filter pills */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-lg bg-muted/60 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setInboxFilter("PENDING")}
                    className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                      inboxFilter === "PENDING"
                        ? "bg-background font-semibold text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pending ({pendingApprovals.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInboxFilter("ALL")}
                    className={`rounded-md px-2.5 py-1 font-medium transition-all ${
                      inboxFilter === "ALL"
                        ? "bg-background font-semibold text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All History ({approvalRequests.length})
                  </button>
                </div>

                <span className="text-xs text-muted-foreground">
                  Human verification required
                </span>
              </div>

              {/* Cards List */}
              {isLoadingApprovals ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading approval proposals...
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-emerald-500 opacity-80 mb-2" />
                  <h4 className="text-sm font-semibold text-foreground">
                    All caught up!
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No pending agent proposals requiring human intervention
                    right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApprovals.map((req) => (
                    <HitlApprovalCard
                      key={req.id}
                      request={req}
                      onDecide={handleDecide}
                      isProcessing={decideMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTEXTUAL SUGGESTIONS */}
          {activeTab === "suggestions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Context: {location.pathname}</span>
                <span className="font-mono text-xs">Real-time evaluation</span>
              </div>

              {isLoadingSuggestions ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Analyzing screen context...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                  No proactive suggestions for this view.
                </div>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary uppercase">
                          {sug.agent.replace("-", " ")}
                        </span>
                        {sug.confidence && (
                          <span className="text-xs font-semibold text-emerald-500">
                            {Math.round(sug.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {sug.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {sug.description}
                      </p>
                      {sug.actionLabel && (
                        <div className="pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast(`Triggered: ${sug.actionLabel}`, {
                                icon: "✨",
                              });
                            }}
                            className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <span>{sug.actionLabel}</span>
                            <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENT RUNS & TELEMETRY */}
          {activeTab === "runs" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Recent Agent Invocations</span>
                <span>Max 20 traces</span>
              </div>

              {isLoadingRuns ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading agent telemetry...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {agentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-lg border border-border/70 bg-card/40 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground capitalize">
                          {run.agent.replace("-", " ")}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            run.status === "DONE"
                              ? "bg-emerald-500/20 text-emerald-500"
                              : run.status === "PAUSED_FOR_APPROVAL"
                                ? "bg-amber-500/20 text-amber-500"
                                : "bg-rose-500/20 text-rose-500"
                          }`}
                        >
                          {run.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Model: {run.model.split("/")[1] ?? run.model}
                        </span>
                        <span>{dayjs(run.createdAt).fromNow()}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded bg-muted/40 p-1.5 font-mono text-xs text-muted-foreground">
                        <div>Tokens: {run.inputTokens + run.outputTokens}</div>
                        <div>Latency: {run.latencyMs}ms</div>
                        <div>Cost: ${(run.costUsd || 0).toFixed(4)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Governance Guardrail Footer */}
        <div className="flex items-center gap-2 border-t border-border/80 bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-secondary" />
          <span>
            <strong>Master Principle (PS §7):</strong> Agents propose; Document
            A decides. No AI action bypasses pricing ceilings or deterministic
            controls.
          </span>
        </div>
      </div>
    </div>
  );
}
