import { useState, useEffect } from "react";
import type { AiStatus, AgentRun } from "@template/shared";
import {
  Sparkles,
  ShieldAlert,
  Power,
  DollarSign,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Edit2,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import {
  fetchAiStatus,
  updateAiConfig,
  fetchAgentRuns,
} from "@/features/ai/services/ai-api";

interface AgentMetadata {
  id: string;
  name: string;
  code: string;
  route: string;
  description: string;
  model: string;
  avgLatency: string;
}

const AGENTS_LIST: AgentMetadata[] = [
  {
    id: "discount-approval",
    name: "Agent 1: AI Discount Reviewer",
    code: "M2 · PS A2/B4",
    route: "/app/approvals",
    description:
      "Evaluates margin leakage, policy thresholds, and RAG historical win-rates.",
    model: "claude-sonnet-4.5",
    avgLatency: "380ms",
  },
  {
    id: "product-recommendation",
    name: "Agent 2: AI Upsell Recommender",
    code: "M6 · PS A6/B5",
    route: "/app/quotations/:id",
    description:
      "Scores customer basket fit, protects margin floors, and ranks add-ons.",
    model: "claude-sonnet-4.5",
    avgLatency: "290ms",
  },
  {
    id: "fulfillment-planner",
    name: "Agent 3: AI Fulfillment Planner",
    code: "M7 · PS A7/B6",
    route: "/app/quotations/:id/fulfillment",
    description:
      "Proposes multi-depot inventory splits, cuts transit hops, and flags backorders.",
    model: "claude-sonnet-4.5",
    avgLatency: "340ms",
  },
  {
    id: "billing-assistant",
    name: "Agent 4: AI Billing Assistant",
    code: "M8 · PS A8/B7",
    route: "/app/quotations/:id/billing",
    description:
      "Blueprint hybrid schedule explainer, proration formula auditor, and credit note drafter.",
    model: "claude-sonnet-4.5",
    avgLatency: "310ms",
  },
  {
    id: "deal-health-monitor",
    name: "Agent 5: AI Deal Health Radar",
    code: "M10 · PS A10/B9",
    route: "/app/deal-health",
    description:
      "Prioritizes velocity anomalies into P1/P2/P3 tiers and drafts recovery outreach.",
    model: "claude-sonnet-4.5",
    avgLatency: "350ms",
  },
  {
    id: "negotiation-assistant",
    name: "Agent 6: Negotiation Simulator",
    code: "M9 · PS A9/B10",
    route: "/portal",
    description:
      "Simulates customer counter-offers, protects margin floors, and drafts win-win terms.",
    model: "claude-sonnet-4.5",
    avgLatency: "410ms",
  },
  {
    id: "sales-insights",
    name: "Agent 7: Conversational Analytics",
    code: "M11 · PS A11/B8",
    route: "/app/reports",
    description:
      "Processes conversational queries into safe filters with executive synthesis.",
    model: "claude-sonnet-4.5",
    avgLatency: "360ms",
  },
];

export function AiOperationsTab() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  const [status, setStatus] = useState<AiStatus | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("50.00");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [aiStatus, runList] = await Promise.all([
        fetchAiStatus(),
        fetchAgentRuns(25),
      ]);
      setStatus(aiStatus);
      setRuns(runList);
      setBudgetInput(aiStatus.monthlyBudgetUsd.toFixed(2));
    } catch (err) {
      console.error("Failed to load AI operations data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchAiStatus(), fetchAgentRuns(25)])
      .then(([aiStatus, runList]) => {
        if (mounted) {
          setStatus(aiStatus);
          setRuns(runList);
          setBudgetInput(aiStatus.monthlyBudgetUsd.toFixed(2));
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to load AI operations data:", err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleMaster = async () => {
    if (!status || !isAdmin) return;
    setIsUpdating(true);
    try {
      const nextEnabled = !status.enabled;
      const updated = await updateAiConfig({ enabled: nextEnabled });
      setStatus(updated);
      setSaveNotice(
        nextEnabled
          ? "Master AI layer enabled. All 7 agents operational."
          : "Master AI kill-switch engaged. Operating in deterministic fallback mode.",
      );
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err) {
      console.error("Failed to toggle master AI:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAgent = async (agentId: string) => {
    if (!status || !isAdmin) return;
    const currentVal = status.agentFlags?.[agentId] ?? true;
    const nextVal = !currentVal;

    setIsUpdating(true);
    try {
      const updated = await updateAiConfig({
        agentFlags: { [agentId]: nextVal },
      });
      setStatus(updated);
      setSaveNotice(
        `${agentId} is now ${nextVal ? "enabled" : "disabled (graceful fallback active)"}.`,
      );
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err) {
      console.error("Failed to toggle agent flag:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!isAdmin) return;
    const parsed = parseFloat(budgetInput);
    if (Number.isNaN(parsed) || parsed <= 0) return;

    setIsUpdating(true);
    try {
      const updated = await updateAiConfig({ monthlyBudgetUsd: parsed });
      setStatus(updated);
      setIsEditingBudget(false);
      setSaveNotice(`Monthly AI budget cap set to $${parsed.toFixed(2)} USD.`);
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err) {
      console.error("Failed to update AI budget:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-24">
        <Spinner size="lg" />
        <p className="text-xs font-medium text-muted-foreground animate-pulse">
          Loading AI telemetry and control switchboard...
        </p>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const spendPct = Math.min(
    100,
    Math.round((status.spendUsd / status.monthlyBudgetUsd) * 100),
  );
  const totalTokens = runs.reduce(
    (acc, r) => acc + (r.inputTokens + r.outputTokens),
    0,
  );
  const successfulRuns = runs.filter((r) => r.status === "DONE").length;
  const successRate =
    runs.length > 0 ? Math.round((successfulRuns / runs.length) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {saveNotice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* Master Control Card */}
      <div className="surface-card rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Agentic AI Operations & Master Switchboard
              </h2>
              <Badge
                tone={status.enabled ? "success" : "warning"}
                className="text-xs font-semibold"
              >
                {status.enabled ? "System Operational" : "Kill-Switch Engaged"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Centralized runtime management for all 7 autonomous agents.
              Instant kill-switch activates Document A deterministic fallback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={isUpdating}
              className="h-9 gap-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>

            {isAdmin && (
              <Button
                variant={status.enabled ? "outline" : "primary"}
                size="sm"
                onClick={handleToggleMaster}
                disabled={isUpdating}
                className="h-9 gap-2 rounded-xl text-xs font-semibold"
              >
                <Power className="size-3.5" />
                {status.enabled
                  ? "Engage Master Kill-Switch"
                  : "Enable Master AI Layer"}
              </Button>
            )}
          </div>
        </div>

        {/* Status Callout if Degraded */}
        {!status.enabled && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <span className="font-semibold">
                Deterministic Fallback Active:{" "}
              </span>
              {status.degradedReason ??
                "All agents are currently disabled. User interfaces will operate using Document A deterministic rules."}
            </div>
          </div>
        )}

        {/* Global KPI Telemetry Ribbon */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          {/* Spend vs Budget */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Month-to-Date Spend</span>
              <DollarSign className="size-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-foreground">
                ${status.spendUsd.toFixed(4)}
              </span>
              <span className="text-xs text-muted-foreground">
                / ${status.monthlyBudgetUsd.toFixed(2)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.max(2, spendPct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{spendPct}% of cap consumed</span>
              {isAdmin && !isEditingBudget && (
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(true)}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Edit2 className="size-3" />
                  Edit Cap
                </button>
              )}
            </div>

            {isEditingBudget && (
              <div className="mt-2 flex items-center gap-1.5">
                <Input
                  type="number"
                  step="5"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveBudget}
                  disabled={isUpdating}
                  className="h-7 px-2 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingBudget(false)}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Latency */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>p95 Latency</span>
              <Clock className="size-3.5 text-primary" />
            </div>
            <div className="mt-1 text-lg font-bold text-foreground">~340ms</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Streaming inference velocity
            </p>
          </div>

          {/* Token Footprint */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Token Footprint</span>
              <Cpu className="size-3.5 text-purple-500" />
            </div>
            <div className="mt-1 text-lg font-bold text-foreground">
              {totalTokens.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Prompt & response tokens logged
            </p>
          </div>

          {/* Success Rate */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Execution Reliability</span>
              <Activity className="size-3.5 text-emerald-500" />
            </div>
            <div className="mt-1 text-lg font-bold text-foreground">
              {successRate}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {successfulRuns} / {runs.length} successful steps
            </p>
          </div>
        </div>
      </div>

      {/* Per-Agent Switchboard Table */}
      <div className="surface-card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Per-Agent Governance Switchboard
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Granularly enable or disable specific autonomous agents across
              DealFlow360 interfaces.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Agent Name</th>
                <th className="px-3 py-2.5 font-semibold">Specification</th>
                <th className="px-3 py-2.5 font-semibold">Model Provider</th>
                <th className="px-3 py-2.5 font-semibold">Target Interface</th>
                <th className="px-3 py-2.5 font-semibold">Avg Latency</th>
                <th className="px-3 py-2.5 text-center font-semibold">
                  Status
                </th>
                <th className="px-3 py-2.5 text-right font-semibold">
                  Control
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {AGENTS_LIST.map((agent) => {
                const isAgentActive =
                  status.enabled && (status.agentFlags?.[agent.id] ?? true);

                return (
                  <tr key={agent.id} className="hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium text-foreground">
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {agent.description}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      {agent.code}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <Badge tone="neutral" className="text-xs">
                        {agent.model}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      {agent.route}
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {agent.avgLatency}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <Badge
                        tone={isAgentActive ? "success" : "warning"}
                        className="text-xs font-semibold"
                      >
                        {isAgentActive ? "Active" : "Degraded"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleToggleAgent(agent.id)}
                          disabled={isUpdating || !status.enabled}
                          className={`inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                            isAgentActive ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isAgentActive ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Read-Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Agent Execution Run Traces */}
      <div className="surface-card rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-emerald-500" />
              <h3 className="text-base font-bold text-foreground">
                Agent Execution Run Telemetry
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Step-by-step audit logs showing token costs, latency, and
              invocation status.
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            {runs.length} Runs Recorded
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Run ID</th>
                <th className="px-3 py-2.5 font-semibold">Agent</th>
                <th className="px-3 py-2.5 font-semibold">Model</th>
                <th className="px-3 py-2.5 font-semibold text-center">
                  Status
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  Tokens (In / Out)
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  Cost (USD)
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">
                  Latency
                </th>
                <th className="px-3 py-2.5 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-muted/20">
                  <td className="px-3 py-2.5 font-semibold text-foreground">
                    {run.id}
                  </td>
                  <td className="px-3 py-2.5 font-sans font-medium text-foreground">
                    {run.agent}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {run.model.replace("anthropic/", "")}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge
                      tone={
                        run.status === "DONE"
                          ? "success"
                          : run.status === "RUNNING"
                            ? "primary"
                            : run.status === "PAUSED_FOR_APPROVAL"
                              ? "warning"
                              : "danger"
                      }
                      className="text-xs font-sans"
                    >
                      {run.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">
                    {run.inputTokens} / {run.outputTokens}
                  </td>
                  <td className="px-3 py-2.5 text-right text-foreground">
                    ${run.costUsd.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">
                    {run.latencyMs}ms
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">
                    {run.createdAt.slice(11, 19)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
