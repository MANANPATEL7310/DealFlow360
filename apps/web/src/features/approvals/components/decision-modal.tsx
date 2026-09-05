import { useState } from "react";
import type {
  ApprovalDecision,
  ApprovalDecisionInput,
  Quotation,
  QuotationApprovalStep,
} from "@template/shared";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Shield,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  currentStep: QuotationApprovalStep | null;
  isPending: boolean;
  onSubmit: (input: ApprovalDecisionInput) => Promise<void> | void;
}

export function DecisionModal({
  isOpen,
  onClose,
  quotation,
  currentStep,
  isPending,
  onSubmit,
}: DecisionModalProps) {
  const [decision, setDecision] =
    useState<Extract<ApprovalDecision, "APPROVED" | "RETURNED" | "REJECTED">>(
      "APPROVED",
    );
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sortedSteps = [...quotation.approvals].sort(
    (a, b) => a.sequence - b.sequence,
  );
  const isFinalStep =
    currentStep &&
    sortedSteps.length > 0 &&
    currentStep.sequence === sortedSteps[sortedSteps.length - 1]?.sequence;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setValidationError("Please provide at least 3 characters of justification.");
      return;
    }
    setValidationError(null);

    await onSubmit({
      decision,
      reason: trimmed,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="surface-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Submit Review Decision
              </h3>
              <p className="text-xs text-muted-foreground">
                Quotation {quotation.quotationNumber} •{" "}
                {currentStep?.level === "SALES_MANAGER"
                  ? "Tier 1: Sales Manager Review"
                  : currentStep?.level === "FINANCE"
                    ? "Tier 2: Finance Review"
                    : "Governance Review"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Decision Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Review Action
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision("APPROVED")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  decision === "APPROVED"
                    ? "border-success bg-success/15 text-success-dark shadow-sm"
                    : "border-border bg-surface-muted/30 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <CheckCircle2 className="size-4" />
                Approve
              </button>

              <button
                type="button"
                onClick={() => setDecision("RETURNED")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  decision === "RETURNED"
                    ? "border-warning bg-warning/15 text-warning-dark shadow-sm"
                    : "border-border bg-surface-muted/30 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <RotateCcw className="size-4" />
                Return
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECTED")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  decision === "REJECTED"
                    ? "border-danger bg-danger/15 text-danger-dark shadow-sm"
                    : "border-border bg-surface-muted/30 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                <XCircle className="size-4" />
                Reject
              </button>
            </div>
          </div>

          {/* Contextual Consequence Banner */}
          <div
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
              decision === "APPROVED"
                ? "border-success/30 bg-success/10 text-success-dark"
                : decision === "RETURNED"
                  ? "border-warning/30 bg-warning/10 text-warning-dark"
                  : "border-danger/30 bg-danger/10 text-danger-dark"
            }`}
          >
            {decision === "APPROVED" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : decision === "RETURNED" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            )}
            <div>
              <span className="font-bold">Workflow Consequence: </span>
              {decision === "APPROVED" && isFinalStep && (
                <span>
                  Approving will complete the approval workflow and transition quotation to{" "}
                  <strong>APPROVED</strong>, authorizing it for client issuance.
                </span>
              )}
              {decision === "APPROVED" && !isFinalStep && (
                <span>
                  Approving will sign off Tier 1 and advance this deal to{" "}
                  <strong>Tier 2 (Finance Review)</strong>. Quotation status remains{" "}
                  <strong>PENDING_APPROVAL</strong>.
                </span>
              )}
              {decision === "RETURNED" && (
                <span>
                  Returning will revert quotation to <strong>DRAFT</strong> status with your
                  notes, enabling the sales rep to revise discounts.
                </span>
              )}
              {decision === "REJECTED" && (
                <span>
                  Rejecting will lock this quotation as <strong>REJECTED</strong> and terminate
                  the commercial deal.
                </span>
              )}
            </div>
          </div>

          {/* Justification Comment Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Decision Justification / Reviewer Notes *
              </label>
              <span className="text-xs text-muted-foreground">Mandatory</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              rows={3}
              placeholder={
                decision === "APPROVED"
                  ? "e.g., Margins are acceptable given enterprise multi-year commitment."
                  : decision === "RETURNED"
                    ? "e.g., Reduce discount on AI Accelerator to under 12% and resubmit."
                    : "e.g., Unacceptable discount combination resulting in negative gross margin."
              }
              className="w-full rounded-xl border border-border bg-surface-muted/30 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
            {validationError && (
              <p className="text-xs font-medium text-danger">{validationError}</p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onClose}
              className="h-9 rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className={`h-9 gap-1.5 rounded-xl text-xs font-semibold ${
                decision === "APPROVED"
                  ? "bg-success text-white hover:bg-success/90"
                  : decision === "RETURNED"
                    ? "bg-warning text-white hover:bg-warning/90"
                    : "bg-danger text-white hover:bg-danger/90"
              }`}
            >
              {isPending && <Spinner className="size-3.5" />}
              Confirm {decision === "APPROVED" ? "Approval" : decision === "RETURNED" ? "Return" : "Rejection"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
