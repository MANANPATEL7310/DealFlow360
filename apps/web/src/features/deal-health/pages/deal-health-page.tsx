import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import type {
  DealHealthAlert,
  HealthCategory,
  ResolveAlertInput,
} from "@template/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { AlertActionModal } from "../components/alert-action-modal";
import { AnomalyAlertFeed } from "../components/anomaly-alert-feed";
import { DealHealthKpiGrid } from "../components/deal-health-kpi-grid";
import { DealHealthRadarView } from "../components/deal-health-radar-view";
import { DealHealthTable } from "../components/deal-health-table";
import { AiDealHealthTriageCard } from "../components/ai-deal-health-triage-card";
import { AiRecoveryNudgeModal } from "../components/ai-recovery-nudge-modal";
import {
  useAcknowledgeAlert,
  useDealHealthAlerts,
  useDealHealthSummary,
  useResolveAlert,
  useTriggerDetectionScan,
} from "../hooks/use-deal-health";

export function DealHealthPage() {
  const [selectedCategory, setSelectedCategory] = useState<
    HealthCategory | "ALL"
  >("ALL");
  const [activeTab, setActiveTab] = useState<"FEED" | "TABLE">("FEED");
  const [resolvingAlert, setResolvingAlert] = useState<DealHealthAlert | null>(
    null,
  );
  const [nudgingAlert, setNudgingAlert] = useState<DealHealthAlert | null>(
    null,
  );
  const [nudgePrefill, setNudgePrefill] = useState<string | undefined>(
    undefined,
  );
  const [notification, setNotification] = useState<string | null>(null);

  const { data: summaryData, isLoading: isLoadingSummary } =
    useDealHealthSummary();
  const { data: alerts, isLoading: isLoadingAlerts } = useDealHealthAlerts();

  const triggerScan = useTriggerDetectionScan();
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleOpenNudgeModal = (alert: DealHealthAlert, prefill?: string) => {
    setNudgingAlert(alert);
    setNudgePrefill(prefill);
  };

  const handleRunScan = async () => {
    try {
      await triggerScan.mutateAsync();
      showToast(
        "Autonomous anomaly scan completed. All deal telemetry refreshed!",
      );
    } catch {
      showToast("Scan failed to execute. Please try again.");
    }
  };

  const handleAcknowledge = async (alert: DealHealthAlert) => {
    try {
      await acknowledgeAlert.mutateAsync({ alertId: alert.id });
      showToast(`Alert on ${alert.quotationCode} acknowledged.`);
    } catch {
      showToast("Failed to acknowledge alert.");
    }
  };

  const handleResolve = async (alertId: string, input: ResolveAlertInput) => {
    try {
      await resolveAlert.mutateAsync({ alertId, input });
      showToast("Anomaly resolved and recorded in compliance audit log.");
      setResolvingAlert(null);
    } catch {
      showToast("Failed to resolve alert.");
    }
  };

  if (isLoadingSummary || isLoadingAlerts) {
    return (
      <div className="space-y-6 pb-12">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const summary = summaryData?.summary;
  const scores = summaryData?.scores ?? [];

  if (!summary) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Banner */}
      {notification && (
        <div className="sticky top-4 z-40 mx-auto w-full max-w-2xl">
          <div className="flex items-center justify-between rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-semibold shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-primary-foreground/80 hover:text-primary-foreground text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header with Title and Run Scan action */}
      <div className="surface-card rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Deal Health
              </h1>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Continuous monitoring for stalled deals, discount anomalies, and
              fulfillment bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleRunScan}
              disabled={triggerScan.isPending}
              size="md"
              className="gap-2 font-semibold shadow-sm"
            >
              {triggerScan.isPending ? (
                <>
                  <Spinner className="size-3.5" />
                  <span>Scanning Pipeline...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5" />
                  <span>Run Autonomous Scan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Top Level KPI Metric Grid */}
      <DealHealthKpiGrid summary={summary} />

      {/* Multi-Band Radar Distribution View */}
      <DealHealthRadarView
        summary={summary}
        scores={scores}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Agent 5: Autonomous Deal Health Triage & Recovery Assistant */}
      <AiDealHealthTriageCard onOpenNudgeModal={handleOpenNudgeModal} />

      {/* Section View Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("FEED")}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "FEED"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="size-3.5" />
          <span>Active alerts</span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs">
            {alerts?.filter((a) => a.status === "open").length ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TABLE")}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "TABLE"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSpreadsheet className="size-3.5" />
          <span>Monitored Quotations Directory</span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-xs">
            {scores.length}
          </span>
        </button>
      </div>

      {/* Active Tab Panel */}
      {activeTab === "FEED" ? (
        <AnomalyAlertFeed
          alerts={alerts ?? []}
          onAcknowledge={handleAcknowledge}
          onOpenResolveModal={(alert) => setResolvingAlert(alert)}
          onOpenNudgeModal={handleOpenNudgeModal}
        />
      ) : (
        <DealHealthTable scores={scores} selectedCategory={selectedCategory} />
      )}

      {/* Resolve Alert Audit Modal */}
      <AlertActionModal
        isOpen={Boolean(resolvingAlert)}
        onClose={() => setResolvingAlert(null)}
        alert={resolvingAlert}
        onResolve={handleResolve}
      />

      {/* Agent 5: AI Recovery Nudge HITL Modal */}
      <AiRecoveryNudgeModal
        isOpen={Boolean(nudgingAlert)}
        onClose={() => {
          setNudgingAlert(null);
          setNudgePrefill(undefined);
        }}
        alert={nudgingAlert}
        initialDraft={nudgePrefill}
        onSuccess={showToast}
      />
    </div>
  );
}
