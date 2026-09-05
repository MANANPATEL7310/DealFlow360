import { useState } from "react";
import {
  AlertCircle,
  DollarSign,
  MessageSquarePlus,
  Percent,
  Send,
  X,
} from "lucide-react";
import type {
  CreateNegotiationInput,
  PortalQuotationLine,
  PortalQuotationView,
} from "@template/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PortalNegotiationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: PortalQuotationView;
  selectedLine?: PortalQuotationLine | null;
  onSubmit: (input: CreateNegotiationInput) => Promise<void>;
}

export function PortalNegotiationDrawer({
  isOpen,
  onClose,
  quotation,
  selectedLine,
  onSubmit,
}: PortalNegotiationDrawerProps) {
  const [targetScope, setTargetScope] = useState<"ORDER" | "LINE">(
    selectedLine ? "LINE" : "ORDER",
  );
  const [lineId, setLineId] = useState<string>(
    selectedLine?.id ?? quotation.lines[0]?.id ?? "",
  );
  const [counterDiscountPct, setCounterDiscountPct] = useState<string>("8.0");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLine = quotation.lines.find((l) => l.id === lineId);
  const parsedDiscount = parseFloat(counterDiscountPct) || 0;

  // Compute live preview savings
  let proposedSavingsMinor = 0;

  if (targetScope === "LINE" && currentLine) {
    const gross = currentLine.qty * currentLine.unitPriceMinor;
    proposedSavingsMinor = Math.round(gross * (parsedDiscount / 100));
  } else {
    proposedSavingsMinor = Math.round(
      quotation.subtotalMinor * (parsedDiscount / 100),
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMessage(
        "Please share a brief rationale or question for your sales representative.",
      );
      return;
    }

    if (parsedDiscount < 0 || parsedDiscount > 90) {
      setErrorMessage("Counter discount must be between 0% and 90%.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        lineId: targetScope === "LINE" ? lineId : undefined,
        counterDiscountPct: parsedDiscount > 0 ? parsedDiscount : undefined,
        comment: comment.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit negotiation request.";
      setErrorMessage(msg);
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
              <MessageSquarePlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Propose Commercial Adjustment
              </h3>
              <p className="text-xs text-muted-foreground">
                Submit a structured counter-offer or note to{" "}
                {quotation.salesRepName}.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/20">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Scope Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">
              Scope of Adjustment
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetScope("LINE")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  targetScope === "LINE"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-surface-muted/30 hover:bg-surface-muted"
                }`}
              >
                <span className="text-xs font-semibold text-foreground">
                  Specific Line Item
                </span>
                <span className="text-xs text-muted-foreground">
                  Counter a single product or license
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetScope("ORDER")}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                  targetScope === "ORDER"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-surface-muted/30 hover:bg-surface-muted"
                }`}
              >
                <span className="text-xs font-semibold text-foreground">
                  Overall Proposal
                </span>
                <span className="text-xs text-muted-foreground">
                  Concession across entire proposal
                </span>
              </button>
            </div>
          </div>

          {/* Line selection if Line scope */}
          {targetScope === "LINE" && (
            <div className="space-y-1.5">
              <Label
                htmlFor="lineSelect"
                className="text-xs font-semibold text-foreground"
              >
                Select Item
              </Label>
              <select
                id="lineSelect"
                value={lineId}
                onChange={(e) => setLineId(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {quotation.lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.productName} ({l.qty}x @ $
                    {(l.unitPriceMinor / 100).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Counter Discount % and Live calculation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="counterDiscount"
                className="text-xs font-semibold text-foreground"
              >
                Target Discount (%)
              </Label>
              <span className="text-xs text-muted-foreground font-mono">
                Currently:{" "}
                {targetScope === "LINE" && currentLine
                  ? `${currentLine.discountPct}%`
                  : "Standard"}
              </span>
            </div>

            <div className="relative">
              <Input
                id="counterDiscount"
                type="number"
                step="0.5"
                min="0"
                max="90"
                value={counterDiscountPct}
                onChange={(e) => setCounterDiscountPct(e.target.value)}
                className="pr-8 font-mono text-sm font-semibold"
                placeholder="e.g. 10.0"
              />
              <Percent className="pointer-events-none absolute right-3 top-2.5 size-4 text-muted-foreground" />
            </div>

            {/* Savings preview callout */}
            <div className="flex items-center justify-between rounded-lg bg-surface-muted/60 p-3 text-xs border border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="size-3.5 text-emerald-500" />
                Projected Concession Savings:
              </span>
              <span className="font-mono font-bold text-foreground">
                ${(proposedSavingsMinor / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Rationale / Note */}
          <div className="space-y-1.5">
            <Label
              htmlFor="comment"
              className="text-xs font-semibold text-foreground"
            >
              Commercial Context / Justification
            </Label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Can we lock in 8% discount if we agree to a 2-year upfront commitment?"
              className="w-full rounded-lg border border-border bg-surface p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          {/* Actions */}
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
              className="gap-2 font-semibold"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Submit Counter-Offer</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
