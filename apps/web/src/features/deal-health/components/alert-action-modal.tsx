import { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import type { DealHealthAlert, ResolveAlertInput } from "@template/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface AlertActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: DealHealthAlert | null;
  onResolve: (alertId: string, input: ResolveAlertInput) => Promise<void>;
}

export function AlertActionModal({
  isOpen,
  onClose,
  alert,
  onResolve,
}: AlertActionModalProps) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionTaken, setActionTaken] =
    useState<ResolveAlertInput["actionTaken"]>("MANAGER_OVERRIDE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !alert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setErrorMsg("Please provide an audit explanation or resolution note.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onResolve(alert.id, {
        resolutionNote: resolutionNote.trim(),
        actionTaken,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to resolve anomaly.";
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
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Resolve Anomaly Alert
              </h3>
              <p className="text-xs text-muted-foreground">
                {alert.quotationCode} • {alert.customerName}
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
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/20">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Anomaly summary pill */}
          <div className="rounded-xl border border-border bg-surface-muted/50 p-3.5 space-y-1">
            <div className="text-xs font-semibold text-foreground">
              {alert.title}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {alert.detail}
            </p>
          </div>

          {/* Action Taken Selector */}
          <div className="space-y-1.5">
            <Label
              htmlFor="actionTaken"
              className="text-xs font-semibold text-foreground"
            >
              Operational Resolution Type
            </Label>
            <select
              id="actionTaken"
              value={actionTaken}
              onChange={(e) =>
                setActionTaken(
                  e.target.value as ResolveAlertInput["actionTaken"],
                )
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="MANAGER_OVERRIDE">
                Sales Ops / Executive Override Authorized
              </option>
              <option value="DISCOUNT_REVISED">
                Commercial Discount Concession Revised
              </option>
              <option value="DEAL_ACCELERATED">
                Customer Re-engaged & Stage Accelerated
              </option>
              <option value="STOCK_ALLOCATED">
                Multi-Depot Inventory Stock Reallocated
              </option>
              <option value="FALSE_POSITIVE">
                Non-Material Deviation / False Positive
              </option>
            </select>
          </div>

          {/* Audit Note Textarea */}
          <div className="space-y-1.5">
            <Label
              htmlFor="resolutionNote"
              className="text-xs font-semibold text-foreground"
            >
              Audit Resolution Note
            </Label>
            <textarea
              id="resolutionNote"
              rows={3}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Explain the commercial rationale, adjustment agreed, or escalation completed..."
              className="w-full rounded-lg border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              required
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 font-semibold"
            >
              {isSubmitting ? (
                <span>Archiving...</span>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Confirm Resolution</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
