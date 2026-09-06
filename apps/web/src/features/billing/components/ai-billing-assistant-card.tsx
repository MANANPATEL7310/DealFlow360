import { useState, useEffect } from "react";
import type { AiBillingExplanation, Invoice } from "@template/shared";
import {
  Sparkles,
  Receipt,
  Repeat,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FilePlus2,
  Calculator,
  Info,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchAiBillingExplanation } from "@/features/ai/services/ai-api";
import { AiCreditNoteDraftModal } from "./ai-credit-note-draft-modal";

interface AiBillingAssistantCardProps {
  quotationId: string;
  invoices?: Invoice[];
}

export function AiBillingAssistantCard({
  quotationId,
  invoices = [],
}: AiBillingAssistantCardProps) {
  const [explanation, setExplanation] = useState<AiBillingExplanation | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [showProrationAudit, setShowProrationAudit] = useState(false);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);

  const loadExplanation = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetchAiBillingExplanation(quotationId);
      setExplanation(res);
    } catch (err) {
      console.error("Failed to load AI billing explanation:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchAiBillingExplanation(quotationId)
      .then((res) => {
        if (mounted) {
          setExplanation(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to load AI billing explanation:", err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [quotationId]);

  if (isLoading) {
    return (
      <div className="surface-card rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/5 via-background to-primary/5 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Spinner className="size-5 text-purple-600 dark:text-purple-400" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">
              Analyzing billing schedule & prorations...
            </div>
            <div className="text-xs text-muted-foreground">
              Auditing one-time upfront charges, subscription recurring cycles,
              and mid-cycle adjustments.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return null;
  }

  return (
    <>
      <div className="surface-card rounded-2xl border border-purple-500/20 bg-card p-6 shadow-sm transition-all">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  AI billing & schedule assistant
                </h3>
                <Badge tone="primary" className="text-xs">
                  Claude 4.5 Sonnet
                </Badge>
                <Badge tone="success" className="text-xs">
                  Proration verified
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Explains hybrid billing schedules, verifies mid-cycle proration,
                and generates draft credit notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreditNoteModalOpen(true)}
              className="h-8 gap-1.5 rounded-lg border-purple-500/30 text-xs text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
            >
              <FilePlus2 className="size-3.5" />
              Draft credit note
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => loadExplanation(true)}
              disabled={isRefreshing}
              className="h-8 gap-1.5 rounded-lg px-2 text-xs"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Re-audit
            </Button>
          </div>
        </div>

        {/* Narrative Executive Summary Callout */}
        <div className="mt-4 rounded-xl border border-purple-500/15 bg-purple-500/5 p-4 text-xs text-foreground/90">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-purple-600 dark:text-purple-400" />
            <div>
              <span className="font-semibold text-purple-700 dark:text-purple-300">
                Hybrid Billing Blueprint:{" "}
              </span>
              {explanation.executiveSummary}
            </div>
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Upfront Charges</span>
              <Receipt className="size-4 text-sky-500" />
            </div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {explanation.upfrontChargesBreakdown}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Recurring Subscriptions</span>
              <Repeat className="size-4 text-purple-500" />
            </div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {explanation.recurringSchedulesBreakdown}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Audit & Settlement</span>
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
            <div className="mt-1 text-xs font-medium text-foreground">
              {explanation.taxAndMarginAudit}
            </div>
          </div>
        </div>

        {/* Mid-cycle Proration Verification Box */}
        {explanation.prorationPolicyVerified && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    Proration verified:{" "}
                  </span>
                  <span className="text-foreground/90">
                    Mid-cycle changes are prorated per day against the billing
                    ledger with zero uncollected exposure.
                    {explanation.nextPaymentMilestone && (
                      <span className="ml-1.5 text-muted-foreground">
                        Next Milestone: {explanation.nextPaymentMilestone}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowProrationAudit(!showProrationAudit)}
                className="h-7 shrink-0 gap-1 rounded-lg text-xs"
              >
                <Calculator className="size-3.5" />
                {showProrationAudit ? "Hide Formula" : "View Formula"}
              </Button>
            </div>

            {showProrationAudit && (
              <div className="mt-3 rounded-lg border border-border bg-background p-3 text-xs font-mono text-muted-foreground">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Layers className="size-3.5 text-primary" />
                  <span>Proration Engine Invariants:</span>
                </div>
                <div className="mt-1.5 text-xs">
                  Credit = activePrice &times; (unconsumedDays / totalCycleDays)
                </div>
                <div className="mt-0.5 text-xs">
                  Charge = updatedPrice &times; (remainingDays / totalCycleDays)
                </div>
                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  &check; Mathematical delta verified: ledger balance matches
                  schedule invariant.
                </div>
              </div>
            )}
          </div>
        )}

        {auditSuccessMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            {auditSuccessMsg}
          </div>
        )}
      </div>

      {/* Credit Note HITL Draft Modal */}
      <AiCreditNoteDraftModal
        isOpen={isCreditNoteModalOpen}
        onClose={() => setIsCreditNoteModalOpen(false)}
        quotationId={quotationId}
        scheduleId={explanation.scheduleId}
        invoices={invoices}
        onDraftCreated={(approvalId) => {
          setAuditSuccessMsg(
            `Credit Note draft staged into Finance Approval Queue (${approvalId})!`,
          );
          setTimeout(() => setAuditSuccessMsg(null), 6000);
        }}
      />
    </>
  );
}
