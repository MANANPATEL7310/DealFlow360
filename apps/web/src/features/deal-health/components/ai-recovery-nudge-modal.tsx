import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  Cpu,
  RefreshCw,
  Send,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchAiDraftNudge } from "@/features/ai/services/ai-api";
import { useNudgeAlert } from "../hooks/use-deal-health";
import type { DealHealthAlert } from "@template/shared";

interface AiRecoveryNudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: DealHealthAlert | null;
  initialDraft?: string;
  onSuccess?: (msg: string) => void;
}

type NudgeTone = "professional" | "executive" | "urgency" | "consultative";

export function AiRecoveryNudgeModal({
  isOpen,
  onClose,
  alert,
  initialDraft,
  onSuccess,
}: AiRecoveryNudgeModalProps) {
  const [tone, setTone] = useState<NudgeTone>("professional");
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState<string | null>(null);
  const [shouldEscalate, setShouldEscalate] = useState(false);

  const nudgeMutation = useNudgeAlert();

  // Query AI generated draft when alert or tone changes
  const {
    data: aiDraft,
    isLoading: isGeneratingDraft,
    refetch,
  } = useQuery({
    queryKey: ["ai", "draft-nudge", alert?.id, tone],
    queryFn: () => (alert?.id ? fetchAiDraftNudge(alert.id, tone) : null),
    enabled: isOpen && Boolean(alert?.id),
    staleTime: 1000 * 60,
  });

  const defaultMessage =
    aiDraft?.draftMessage ??
    initialDraft ??
    (alert
      ? `Hi ${alert.customerName} team,\n\nI wanted to follow up regarding quotation ${alert.quotationCode}. Please let us know if you have any questions or if an updated delivery schedule would help.\n\nBest regards,\n${alert.salesRepName}`
      : "");

  const defaultSubject =
    aiDraft?.suggestedSubject ??
    (alert ? `Follow-up on Quotation ${alert.quotationCode}` : "");

  const message = customMessage ?? defaultMessage;
  const subject = customSubject ?? defaultSubject;

  const handleToneChange = (newTone: NudgeTone) => {
    setTone(newTone);
    setCustomMessage(null);
    setCustomSubject(null);
  };

  if (!isOpen || !alert) return null;

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await nudgeMutation.mutateAsync({
        alertId: alert.id,
        input: {
          message: `Subject: ${subject}\n\n${message}`,
          escalateToUserId: shouldEscalate ? "manager" : undefined,
        },
      });

      onSuccess?.(
        shouldEscalate
          ? `Alert escalated to Sales Leadership with audit log.`
          : `Recovery nudge dispatched to ${alert.customerName} procurement.`,
      );
      onClose();
    } catch {
      // Handled by react-query / caller
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nudge-modal-title"
    >
      <div className="surface-card relative flex max-h-screen w-full max-w-2xl flex-col rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-gradient-to-r from-primary/10 via-card to-card">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3
                  id="nudge-modal-title"
                  className="text-base font-bold text-foreground"
                >
                  AI deal recovery nudge assistant
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  <Cpu className="size-2.5" />
                  Claude 4.5
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quotation {alert.quotationCode} • {alert.customerName} (
                {alert.customerTier} Tier)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Review Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary mt-0.5" />
            <span>
              <strong>You stay in control:</strong> AI drafts the recovery copy
              based on deal velocity and how long it's stalled. The sales rep
              reviews, edits, or cancels before anything is sent.
            </span>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Strategic Messaging Tone
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: "professional", label: "Professional Check-in" },
                  { id: "executive", label: "Executive Alignment" },
                  { id: "urgency", label: "Time-Sensitive Allocation" },
                  { id: "consultative", label: "Technical Consultation" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToneChange(t.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    tone === t.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-surface border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCustomMessage(null);
                  setCustomSubject(null);
                  refetch();
                }}
                disabled={isGeneratingDraft}
                className="h-8 gap-1 text-xs text-primary ml-auto"
              >
                <RefreshCw
                  className={`size-3 ${isGeneratingDraft ? "animate-spin" : ""}`}
                />
                Regenerate Copy
              </Button>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              placeholder="Email Subject Line"
            />
          </div>

          {/* Draft Body Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Personalized Message Draft
              </label>
              <span className="text-xs text-muted-foreground font-mono">
                {message.length} chars
              </span>
            </div>
            <div className="relative">
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground leading-relaxed focus:border-primary focus:outline-hidden"
                placeholder="Write or edit customer message..."
              />
              {isGeneratingDraft && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <Spinner className="size-4" />
                    <span>Drafting copy...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Escalation Option */}
          <div className="rounded-xl border border-border bg-surface-muted/40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserCheck className="size-4 text-warning" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Escalate to Sales Leadership
                </p>
                <p className="text-xs text-muted-foreground">
                  Flag high-value stagnation to Sales Manager for executive
                  sponsorship
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              id="escalateToggle"
              checked={shouldEscalate}
              onChange={(e) => setShouldEscalate(e.target.checked)}
              className="size-4 rounded accent-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              disabled={nudgeMutation.isPending || !message.trim()}
              onClick={handleSend}
              className="gap-1.5 text-xs font-semibold shadow-sm"
            >
              {nudgeMutation.isPending ? (
                <>
                  <Spinner className="size-3.5" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>
                    {shouldEscalate
                      ? "Escalate & Send Recovery"
                      : "Send Recovery Nudge"}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
