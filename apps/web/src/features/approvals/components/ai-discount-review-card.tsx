import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDiscountReview,
  fetchAiStatus,
} from "@/features/ai/services/ai-api";
import { DegradedModeBanner } from "@/features/ai/components/degraded-mode-banner";
import type { Quotation, QuotationRiskEvaluation } from "@template/shared";

interface AiDiscountReviewCardProps {
  quotation: Quotation;
  risk?: QuotationRiskEvaluation | null;
  onApplyAdjustment?: (lineId: string, discountPct: number) => void;
}

export function AiDiscountReviewCard({
  quotation,
  risk,
  onApplyAdjustment,
}: AiDiscountReviewCardProps) {
  const [showRAGTable, setShowRAGTable] = useState(true);

  // Check if AI is enabled globally
  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  // Query Agent 1 review
  const {
    data: review,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ai", "discount-review", quotation.id],
    queryFn: () => fetchDiscountReview(quotation.id),
    staleTime: 1000 * 60,
    enabled: Boolean(aiStatus?.enabled && quotation.id),
  });

  if (aiStatus && !aiStatus.enabled) {
    return <DegradedModeBanner status={aiStatus} />;
  }

  if (isLoading) {
    return (
      <Card className="p-5 border-border/80 bg-card/60 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded-full bg-primary/20" />
          <div className="h-4 w-48 rounded bg-muted" />
        </div>
        <div className="h-16 w-full rounded-lg bg-muted/60" />
      </Card>
    );
  }

  if (isError || !review) {
    return null;
  }

  const isApprove = review.recommendation === "APPROVE";
  const isAdjust = review.recommendation === "ADJUST";
  const isReject = review.recommendation === "REJECT";

  return (
    <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-card/80 to-card p-6 shadow-sm backdrop-blur-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-xs">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Agent 1 · AI Discount Approval Review
              </h3>
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                <Cpu className="size-2.5" />
                Claude 4.5
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Autonomous risk analysis & historical deal intelligence
            </p>
          </div>
        </div>

        {/* Recommendation Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
              isApprove
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                : isAdjust
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-500"
            }`}
          >
            {isApprove && <CheckCircle2 className="size-3.5" />}
            {isAdjust && <AlertTriangle className="size-3.5" />}
            {isReject && <XCircle className="size-3.5" />}
            <span>RECOMMENDATION: {review.recommendation}</span>
          </div>

          <span className="rounded-full bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {Math.round(review.confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* AI Rationale & Pre-check */}
      <div className="rounded-xl border border-border/80 bg-background/70 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Governance & Margin Assessment
          </span>
          <span className="text-xs text-muted-foreground">
            Account Tier: {quotation.customer?.tier ?? "STANDARD"} • Risk:{" "}
            {risk?.blendedRiskScore ?? quotation.blendedRiskScore ?? 0}/100
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {review.rationale}
        </p>
      </div>

      {/* Suggested Adjustments (if any) */}
      {review.suggestedAdjustments &&
        review.suggestedAdjustments.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
              <AlertTriangle className="size-4" />
              <span>AI Suggested Concession Tuning</span>
            </div>
            {review.suggestedAdjustments.map((adj, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/80 p-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {adj.productName ?? "Quotation Line Item"}
                  </p>
                  <p className="text-muted-foreground mt-0.5">{adj.reason}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      Current: {adj.currentDiscountPct}%
                    </span>
                    <p className="font-bold text-emerald-500">
                      Target: {adj.suggestedDiscountPct}%
                    </p>
                  </div>
                  {adj.lineId && onApplyAdjustment && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onApplyAdjustment(adj.lineId!, adj.suggestedDiscountPct)
                      }
                      className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/10"
                    >
                      Apply Target %
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* RAG Precedent Deals Table */}
      {review.similarDeals && review.similarDeals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">
                RAG Precedents: Similar Past Approved Deals
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowRAGTable(!showRAGTable)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showRAGTable ? (
                <>
                  Hide Precedents <ChevronUp className="size-3" />
                </>
              ) : (
                <>
                  Show ({review.similarDeals.length}){" "}
                  <ChevronDown className="size-3" />
                </>
              )}
            </button>
          </div>

          {showRAGTable && (
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead className="py-2">Quotation #</TableHead>
                    <TableHead className="py-2">Customer Account</TableHead>
                    <TableHead className="py-2">Tier</TableHead>
                    <TableHead className="py-2 text-right">Discount</TableHead>
                    <TableHead className="py-2 text-right">
                      Gross Margin
                    </TableHead>
                    <TableHead className="py-2 text-right">
                      Approval Time
                    </TableHead>
                    <TableHead className="py-2 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {review.similarDeals.map((deal) => (
                    <TableRow key={deal.id} className="text-xs">
                      <TableCell className="font-mono font-medium text-primary py-2">
                        {deal.quotationNumber}
                      </TableCell>
                      <TableCell className="font-semibold text-foreground py-2">
                        {deal.customerName}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge tone="neutral" className="text-xs">
                          {deal.customerTier}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-right py-2 text-amber-500 font-semibold">
                        {deal.discountPct}%
                      </TableCell>
                      <TableCell className="font-mono text-right py-2 text-emerald-500 font-semibold">
                        {deal.marginPct}%
                      </TableCell>
                      <TableCell className="text-right py-2 text-muted-foreground font-mono">
                        {deal.turnaroundHours}h
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-500">
                          {deal.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Governance Footnote */}
      <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0 text-secondary" />
        <span>
          <strong>Human-In-The-Loop Principle:</strong> AI provides precedent
          and recommendation only. The designated manager/finance reviewer
          retains sole authority to approve or reject.
        </span>
      </div>
    </Card>
  );
}
