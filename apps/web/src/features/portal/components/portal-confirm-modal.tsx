import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldCheck,
  X,
} from "lucide-react";
import type {
  PortalConfirmResult,
  PortalQuotationView,
} from "@template/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PortalConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: PortalQuotationView;
  onConfirmSuccess: (result: PortalConfirmResult) => void;
  onExecuteConfirm: () => Promise<PortalConfirmResult>;
}

export function PortalConfirmModal({
  isOpen,
  onClose,
  quotation,
  onConfirmSuccess,
  onExecuteConfirm,
}: PortalConfirmModalProps) {
  const [signerName, setSignerName] = useState(quotation.contactName || "Authorized Signatory");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gateResult, setGateResult] = useState<PortalConfirmResult | null>(null);

  if (!isOpen) return null;

  const formattedGrandTotal = (quotation.grandTotalMinor / 100).toLocaleString(
    undefined,
    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  );

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMsg("Please accept the terms and conditions to authorize commercial acceptance.");
      return;
    }
    if (!signerName.trim()) {
      setErrorMsg("Please provide your full legal name as authorized signatory.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await onExecuteConfirm();
      setGateResult(result);
      onConfirmSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm proposal.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 bg-surface-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Authorize & Confirm Proposal
              </h3>
              <p className="text-xs text-muted-foreground">
                Proposal {quotation.code} • {quotation.customerName}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="size-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Modal Body */}
        {gateResult ? (
          /* Governance Gate Outcome View */
          <div className="p-6 space-y-6">
            {gateResult.status === "CONFIRMED" ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25">
                  <CheckCircle2 className="size-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground">
                    Proposal Successfully Confirmed!
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Commercial terms and agreed concessions are locked in. Order processing and fulfillment workflows have been initialized.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-muted/50 p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmation Code:</span>
                    <span className="font-mono font-bold text-foreground">{quotation.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Authorized By:</span>
                    <span className="font-medium text-foreground">{signerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Locked Total:</span>
                    <span className="font-mono font-bold text-foreground">${formattedGrandTotal}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Governance Gate Escalation (BOUNCED_TO_APPROVAL) */
              <div className="space-y-4 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25">
                  <Clock className="size-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground">
                    Routing for Executive Governance Sign-Off
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    {gateResult.message}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Governance Threshold Applied</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Because accepted counter-discounts exceed automatic delegation limits, our deal desk has been assigned to expedite the final approval. You will receive email confirmation the moment review is complete.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={onClose} size="sm" className="font-semibold">
                Done & View Status
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation Sign-Off Form */
          <form onSubmit={handleConfirm} className="p-6 space-y-5">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/20">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Financial Recapitulation */}
            <div className="rounded-xl border border-border bg-surface-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Binding Commercial Total</span>
                <span className="font-mono text-base font-bold text-foreground">
                  ${formattedGrandTotal}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Includes all quoted hardware, software subscriptions, and service deliverables.
              </p>
            </div>

            {/* Authorized Signatory Input */}
            <div className="space-y-1.5">
              <Label htmlFor="signerName" className="text-xs font-semibold text-foreground">
                Authorized Signatory Full Name
              </Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g. David Sterling"
                className="text-xs font-medium"
                required
              />
            </div>

            {/* Agreement Checkbox */}
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-surface-muted/30 transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I confirm that I am authorized to enter into this agreement on behalf of{" "}
                <strong className="text-foreground">{quotation.customerName}</strong>. 
                I accept the pricing, terms of service, and agreed delivery milestones.
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Review Again
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-2 font-semibold shadow-sm"
              >
                {isSubmitting ? (
                  <span>Processing Governance Gate...</span>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Authorize & Accept</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
