import type {
  ComputedTotalsResult,
  Quotation,
  QuotationRiskEvaluation,
} from "@template/shared";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Send,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MarginIndicatorGaugeProps {
  liveTotals: ComputedTotalsResult;
  quote: Quotation;
  risk?: QuotationRiskEvaluation | null;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function MarginIndicatorGauge({
  liveTotals,
  quote,
  risk,
  onConfirm,
  isConfirming,
}: MarginIndicatorGaugeProps) {
  const isDraft = quote.status === "DRAFT";
  const hasLines = quote.lines.length > 0;

  // Margin threshold colors
  const marginPct = liveTotals.marginPct;
  const marginColor =
    marginPct >= 35
      ? "text-success-dark"
      : marginPct >= 20
        ? "text-warning-dark"
        : "text-danger-dark";
  const marginBarColor =
    marginPct >= 35
      ? "bg-success"
      : marginPct >= 20
        ? "bg-warning"
        : "bg-danger";

  // Blended risk display
  const riskScore = risk?.blendedRiskScore ?? quote.blendedRiskScore;
  const isAutoApproved = risk?.isAutoApproved ?? riskScore === 0;
  const requiredLevels = risk?.requiredLevels ?? [];

  return (
    <Card className="space-y-5 p-5">
      {/* Financial Summary */}
      <div className="space-y-2 border-b border-border pb-4">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <DollarSign className="size-3.5 text-primary" /> Deal Financials
        </h3>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>List Subtotal:</span>
            <span className="font-mono text-foreground">
              $
              {(liveTotals.subtotalMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between text-danger-dark">
            <span>Total Discounts:</span>
            <span className="font-mono">
              -$
              {(liveTotals.discountTotalMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>Estimated Tax (8%):</span>
            <span className="font-mono text-foreground">
              $
              {(liveTotals.taxTotalMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
            <span>Grand Total:</span>
            <span className="font-mono text-primary">
              $
              {(liveTotals.grandTotalMinor / 100).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Live Margin Gauge */}
      <div className="space-y-2 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <TrendingUp className="size-3.5 text-primary" /> Gross Deal Margin
          </span>
          <span className={`font-mono text-base font-bold ${marginColor}`}>
            {marginPct.toFixed(1)}%
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${marginBarColor}`}
            style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Target: &gt;35%</span>
          <span>
            {marginPct >= 35
              ? "High Quality Margin"
              : marginPct >= 20
                ? "Acceptable Margin"
                : "Margin Warning"}
          </span>
        </div>
      </div>

      {/* Risk Engine Breakdown */}
      <div className="space-y-3 border-b border-border pb-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
            <Zap className="size-3.5 text-primary" /> Risk Governance Radar
          </span>
          <Badge tone={isAutoApproved ? "success" : "danger"}>
            {isAutoApproved ? "Auto-Approve" : "Escalation Required"}
          </Badge>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-surface-muted/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Blended Risk Score:
            </span>
            <span
              className={`font-mono text-sm font-bold ${
                riskScore === 0 ? "text-success-dark" : "text-danger-dark"
              }`}
            >
              {riskScore.toFixed(2)}
            </span>
          </div>

          <div className="flex items-start justify-between text-xs">
            <span className="text-muted-foreground">Required Chain:</span>
            <div className="flex flex-wrap justify-end gap-1">
              {isAutoApproved ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-dark">
                  <CheckCircle2 className="size-3.5" /> None (Direct Route)
                </span>
              ) : (
                requiredLevels.map((lvl) => (
                  <Badge
                    key={lvl}
                    tone={lvl === "FINANCE" ? "secondary" : "primary"}
                  >
                    {lvl === "FINANCE" ? "Finance Lead" : "Sales Manager"}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Per-line violations alert */}
        {risk && risk.lines.some((l) => !l.isCompliant) && (
          <div className="space-y-1 rounded-lg border border-danger/30 bg-danger-light/10 p-2.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-danger-dark">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Policy Ceiling Overage Detected</span>
            </div>
            {risk.lines
              .filter((l) => !l.isCompliant)
              .map((l) => (
                <div
                  key={l.lineId}
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span className="max-w-36 truncate">{l.productTitle}:</span>
                  <span className="font-mono font-semibold text-danger-dark">
                    +{l.excessDiscountPct.toFixed(1)}% over{" "}
                    {l.effectiveCeilingPct}% cap
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Confirmation Action */}
      <div>
        {isDraft ? (
          <Button
            className="w-full shadow-lg"
            disabled={!hasLines || isConfirming}
            size="md"
            variant="primary"
            onClick={onConfirm}
          >
            {isConfirming ? (
              "Running Risk Engine..."
            ) : isAutoApproved ? (
              <>
                <ShieldCheck className="mr-1.5 size-4" /> Confirm & Auto-Approve
              </>
            ) : (
              <>
                <Send className="mr-1.5 size-4" /> Confirm & Submit Escalation
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-1 rounded-lg border border-border bg-surface-muted/40 p-3 text-center">
            <div className="text-xs font-semibold text-foreground">
              Quotation Status: {quote.status.replace("_", " ")}
            </div>
            <p className="text-xs text-muted-foreground">
              {quote.status === "APPROVED"
                ? "This quotation is approved and ready to be issued to the customer."
                : quote.status === "PENDING_APPROVAL"
                  ? "Awaiting review in the manager/finance approval queue."
                  : "Quotation is active in fulfillment or billing lifecycle."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
