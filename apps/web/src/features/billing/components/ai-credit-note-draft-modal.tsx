import { useState } from "react";
import type { Invoice } from "@template/shared";
import type { AiDraftCreditNoteResponse } from "@template/shared";
import {
  Sparkles,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { requestAiCreditNoteDraft } from "@/features/ai/services/ai-api";

interface AiCreditNoteDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string;
  scheduleId?: string;
  invoices: Invoice[];
  defaultInvoiceId?: string;
  onDraftCreated?: (approvalRequestId: string) => void;
}

export function AiCreditNoteDraftModal({
  isOpen,
  onClose,
  quotationId,
  scheduleId = "sched-default",
  invoices,
  defaultInvoiceId,
  onDraftCreated,
}: AiCreditNoteDraftModalProps) {
  const eligibleInvoices = invoices.filter((i) => i.status !== "VOID");
  const initialInvoiceId = defaultInvoiceId || eligibleInvoices[0]?.id || "";

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(initialInvoiceId);
  const [amountDollars, setAmountDollars] = useState("150.00");
  const [reason, setReason] = useState(
    "Mid-cycle subscription downgrade proration adjustment",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiDraftCreditNoteResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amountDollars);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid credit amount greater than 0.");
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a justification reason for Finance review.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestAiCreditNoteDraft({
        quotationId,
        scheduleId,
        sourceInvoiceId: selectedInvoiceId || undefined,
        suggestedAmountMinor: Math.round(parsed * 100),
        reason: reason.trim(),
      });
      setResult(res);
      if (onDraftCreated) {
        onDraftCreated(res.approvalRequestId);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to draft credit note.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="surface-card w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Draft credit note
                </h3>
                <Badge tone="primary" className="text-xs">
                  AI assisted
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Propose an adjustment for Finance managerial approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        {result ? (
          <div className="my-6 space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Draft Staged for Finance Review
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.financeReviewerNote}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3 text-left text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">
                  Approval Request ID:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {result.approvalRequestId}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Proposed Credit:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${(result.amountMinor / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status:</span>
                <Badge tone="warning" className="text-xs">
                  Pending Finance Decision
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleClose}
              className="w-full rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="my-4 space-y-4">
            {/* Governance Callout */}
            <div className="flex items-start gap-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-foreground/80">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="font-semibold text-foreground">
                  Nothing posts automatically:{" "}
                </span>
                AI never posts directly to the ledger. Submitting stages a
                formal credit note proposal for Finance to review and approve.
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Target Invoice */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Target Invoice
              </label>
              {eligibleInvoices.length > 0 ? (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
                >
                  {eligibleInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} &middot; {inv.kind} &middot; $
                      {(inv.amountMinor / 100).toFixed(2)} ({inv.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No invoices currently generated for this quotation.
                </div>
              )}
            </div>

            {/* Proposed Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Proposed Credit Amount ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="pl-9 text-xs"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Justification Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Proration / Credit Rationale
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-hidden"
                placeholder="Detail why this credit note is warranted..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setReason(
                      "Mid-cycle subscription downgrade proration adjustment",
                    )
                  }
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  Mid-cycle downgrade
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReason("Service outage SLA penalty compensation credit")
                  }
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  SLA credit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReason(
                      "Billing reconciliation correction for delayed delivery",
                    )
                  }
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  Delayed delivery
                </button>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="h-9 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
              >
                {isSubmitting ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <FileText className="size-3.5" />
                )}
                Submit draft to Finance
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
