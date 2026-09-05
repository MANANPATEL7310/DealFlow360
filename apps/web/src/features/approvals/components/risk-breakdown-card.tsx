import type {
  Quotation,
  QuotationRiskEvaluation,
} from "@template/shared";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RiskBreakdownCardProps {
  risk: QuotationRiskEvaluation | null;
  quotation: Quotation;
  isLoading?: boolean;
}

export function RiskBreakdownCard({
  risk,
  quotation,
  isLoading,
}: RiskBreakdownCardProps) {
  if (isLoading) {
    return (
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  const score = risk?.blendedRiskScore ?? quotation.blendedRiskScore ?? 0;
  const isHighRisk = score >= 70;
  const isMediumRisk = score >= 40 && score < 70;

  const riskTone = isHighRisk ? "danger" : isMediumRisk ? "warning" : "success";
  const RiskIcon = isHighRisk
    ? ShieldAlert
    : isMediumRisk
      ? AlertTriangle
      : ShieldCheck;

  return (
    <Card className="space-y-6 p-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-11 items-center justify-center rounded-xl border ${
              isHighRisk
                ? "border-danger/30 bg-danger/10 text-danger"
                : isMediumRisk
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-success/30 bg-success/10 text-success"
            }`}
          >
            <RiskIcon className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Risk & Policy Compliance Analysis
            </h3>
            <p className="text-xs text-muted-foreground">
              Evaluated against customer tier ceilings, product category caps, and margin thresholds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Blended Risk Score</span>
            <div className="flex items-baseline justify-end gap-1">
              <span
                className={`text-2xl font-black ${
                  isHighRisk
                    ? "text-danger"
                    : isMediumRisk
                      ? "text-warning"
                      : "text-success"
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <Badge tone={riskTone} className="px-3 py-1 font-bold">
            {isHighRisk ? "High Risk" : isMediumRisk ? "Medium Risk" : "Low Risk"}
          </Badge>
        </div>
      </div>

      {/* Progress Bar / Metric Meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 (Low Risk)</span>
          <span>40 (Threshold)</span>
          <span>70 (Escalation)</span>
          <span>100 (Critical)</span>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full transition-all duration-500 ${
              isHighRisk
                ? "bg-danger"
                : isMediumRisk
                  ? "bg-warning"
                  : "bg-success"
            }`}
            style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
          />
        </div>
      </div>

      {/* Governance Rule Details Banner */}
      {risk && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/40 p-3 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <span className="font-medium text-foreground">Triggered Policy Rule:</span>
            <span className="text-muted-foreground">{risk.matchedRuleName || "Standard Tier Ceilings"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Required Review Sequence:</span>
            <div className="flex items-center gap-1">
              {risk.requiredLevels.map((lvl, idx) => (
                <span key={lvl} className="flex items-center gap-1">
                  <Badge tone="primary" className="text-xs">
                    {lvl === "SALES_MANAGER" ? "Sales Manager" : "Finance Lead"}
                  </Badge>
                  {idx < risk.requiredLevels.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Line Items Policy Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Line-by-Line Policy Comparison
        </h4>
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-muted/50">
                <TableHead className="text-xs font-semibold">Product & Category</TableHead>
                <TableHead className="text-center text-xs font-semibold">Requested Discount</TableHead>
                <TableHead className="text-center text-xs font-semibold">Policy Ceiling</TableHead>
                <TableHead className="text-center text-xs font-semibold">Excess Overage</TableHead>
                <TableHead className="text-center text-xs font-semibold">Risk Score</TableHead>
                <TableHead className="text-right text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risk?.lines && risk.lines.length > 0 ? (
                risk.lines.map((line) => {
                  const hasOverage = line.excessDiscountPct > 0;
                  return (
                    <TableRow key={line.lineId} className="border-border">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {line.productTitle}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {line.category} • Qty: {line.qty}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-semibold text-foreground">
                        {line.appliedDiscountPct.toFixed(1)}%
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground">
                        {line.effectiveCeilingPct.toFixed(1)}%
                      </TableCell>

                      <TableCell className="text-center">
                        {hasOverage ? (
                          <Badge tone="danger" className="font-bold">
                            +{line.excessDiscountPct.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None (0.0%)</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-medium">
                        <span
                          className={
                            line.lineRiskScore >= 70
                              ? "text-danger"
                              : line.lineRiskScore >= 40
                                ? "text-warning"
                                : "text-success"
                          }
                        >
                          {line.lineRiskScore}/100
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        {line.isCompliant ? (
                          <Badge tone="success" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Compliant
                          </Badge>
                        ) : (
                          <Badge tone="danger" className="gap-1">
                            <AlertCircle className="size-3" />
                            Escalated
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                    No line items available for policy risk breakdown.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
}
