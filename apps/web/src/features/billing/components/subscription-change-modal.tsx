import { useState } from "react";
import type { Invoice } from "@template/shared";
import { daysBetween, prorate } from "@template/shared";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  DollarSign,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionChange } from "../hooks/use-billing";

interface SubscriptionChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string;
  lineId: string;
  lineTitle: string;
  currentInvoice: Invoice | null;
  initialMode?: "modify" | "cancel";
}

export function SubscriptionChangeModal({
  isOpen,
  onClose,
  quotationId,
  lineId,
  lineTitle,
  currentInvoice,
  initialMode = "modify",
}: SubscriptionChangeModalProps) {
  const changeMutation = useSubscriptionChange(quotationId);

  const [mode, setMode] = useState<"modify" | "cancel">(initialMode);
  const currentAmountMinor = currentInvoice?.amountMinor ?? 0;
  const [newAmountDollars, setNewAmountDollars] = useState<string>(
    (currentAmountMinor / 100).toFixed(2),
  );
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentInvoice) return null;

  // Proration calculations
  const now = new Date();
  const periodStart = currentInvoice.periodStart
    ? new Date(currentInvoice.periodStart)
    : now;
  const periodEnd = currentInvoice.periodEnd
    ? new Date(currentInvoice.periodEnd)
    : now;

  const totalCycleDays = Math.max(1, daysBetween(periodStart, periodEnd));
  const remainingDays = Math.min(
    Math.max(daysBetween(now, periodEnd), 0),
    totalCycleDays,
  );

  const parsedNewAmount = mode === "cancel" ? 0 : parseFloat(newAmountDollars);
  const targetNewMinor = Number.isNaN(parsedNewAmount)
    ? currentAmountMinor
    : Math.round(parsedNewAmount * 100);

  let prorationType: "none" | "upgrade" | "downgrade" | "cancel" = "none";
  let prorationMinor = 0;

  if (mode === "cancel") {
    prorationType = "cancel";
    prorationMinor = prorate(currentAmountMinor, now, periodStart, periodEnd);
  } else if (targetNewMinor > currentAmountMinor) {
    prorationType = "upgrade";
    const delta = targetNewMinor - currentAmountMinor;
    prorationMinor = prorate(delta, now, periodStart, periodEnd);
  } else if (targetNewMinor < currentAmountMinor) {
    prorationType = "downgrade";
    const delta = currentAmountMinor - targetNewMinor;
    prorationMinor = prorate(delta, now, periodStart, periodEnd);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError(
        "Please provide a reason for the subscription change or cancellation.",
      );
      return;
    }

    if (
      mode === "modify" &&
      (Number.isNaN(parsedNewAmount) || parsedNewAmount < 0)
    ) {
      setError("Please enter a valid positive new per-period amount.");
      return;
    }

    try {
      await changeMutation.mutateAsync({
        lineId,
        newPeriodAmountMinor: targetNewMinor,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to change subscription.";
      setError(msg);
    }
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xs duration-200">
      <div className="surface-card w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {mode === "cancel"
                ? "Cancel subscription"
                : "Modify subscription seats / tier"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Line:{" "}
              <span className="font-medium text-foreground">{lineTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMode("modify")}
            className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
              mode === "modify"
                ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Modify amount / seats
          </button>
          <button
            type="button"
            onClick={() => setMode("cancel")}
            className={`rounded-lg py-1.5 text-xs font-medium transition-all ${
              mode === "cancel"
                ? "border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cancel subscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === "modify" ? (
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>New per-period amount ($ USD)</span>
                <span>
                  Current: ${(currentAmountMinor / 100).toFixed(2)}/mo
                </span>
              </div>
              <div className="relative">
                <DollarSign className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmountDollars}
                  onChange={(e) => setNewAmountDollars(e.target.value)}
                  className="pl-9 font-mono"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-500 dark:text-rose-400" />
              <div>
                <strong className="mb-1 block font-semibold">
                  Immediate mid-cycle termination
                </strong>
                Cancelling will mark all future draft invoices as void and issue
                a prorated credit note for unearned days in the current cycle.
              </div>
            </div>
          )}

          {/* Live Proration Breakdown Box */}
          <div className="space-y-2.5 rounded-xl border border-border bg-surface-muted/30 p-3.5 text-xs">
            <div className="flex items-center justify-between font-medium text-foreground">
              <div className="flex items-center gap-1.5">
                <Info className="size-4 text-primary" />
                <span>Proration preview</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {remainingDays} of {totalCycleDays} days remaining
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-1 text-xs text-muted-foreground">
              <div>Current cycle end:</div>
              <div className="text-right font-mono text-foreground">
                {periodEnd.toISOString().slice(0, 10)}
              </div>
              <div>Cycle utilization:</div>
              <div className="text-right font-mono text-foreground">
                {(
                  ((totalCycleDays - remainingDays) / totalCycleDays) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background/60 p-2.5">
              {prorationType === "cancel" && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="size-4" />
                    Prorated credit note:
                  </span>
                  <span className="font-mono text-sm font-bold">
                    +${(prorationMinor / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {prorationType === "upgrade" && (
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight className="size-4" />
                    Immediate catch-up invoice:
                  </span>
                  <span className="font-mono text-sm font-bold">
                    ${(prorationMinor / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {prorationType === "downgrade" && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <ArrowDownRight className="size-4" />
                    Prorated overpayment credit:
                  </span>
                  <span className="font-mono text-sm font-bold">
                    +${(prorationMinor / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {prorationType === "none" && (
                <div className="py-1 text-center text-muted-foreground">
                  No rate change detected.
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Reason (required)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer requested upgrade from 5 to 10 seats."
              rows={2}
              className="w-full rounded-md border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={changeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changeMutation.isPending || !reason.trim()}
              className={
                mode === "cancel"
                  ? "bg-rose-600 text-white hover:bg-rose-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-500"
              }
            >
              {changeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 size-4" />
                  {mode === "cancel" ? "Confirm cancellation" : "Apply change"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
