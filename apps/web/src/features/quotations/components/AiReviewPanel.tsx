import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Sliders,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiRoutes } from "@template/shared";
import { apiClient } from "@/services/http/api-client";
import toast from "react-hot-toast";

export interface SimilarDeal {
  quotationId: string;
  customerTier: string;
  orderDiscountPct: number;
  outcome: string;
}

export interface SuggestedAdjustment {
  lineId: string;
  toDiscountPct: number;
}

export interface DiscountApprovalAiResult {
  recommendation: "APPROVE" | "ADJUST" | "REJECT";
  rationale: string;
  suggestedAdjustments?: SuggestedAdjustment[];
  similarApprovedDeals?: SimilarDeal[];
  confidence: number;
}

export interface DiscountApprovalResponse {
  aiAvailable: boolean;
  reason?: string;
  quotationId?: string;
  status?: string;
  result?: DiscountApprovalAiResult;
}

export interface AiReviewPanelProps {
  quotationId: string;
  onApplyAdjustment?: (
    lineId: string,
    toDiscountPct: number,
  ) => Promise<void> | void;
}

export function AiReviewPanel({
  quotationId,
  onApplyAdjustment,
}: AiReviewPanelProps) {
  const [data, setData] = useState<DiscountApprovalResponse | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = apiRoutes.aiDiscountApproval.review.path.replace(
        ":quotationId",
        id,
      );
      const res = await apiClient.post<{
        success: boolean;
        data: DiscountApprovalResponse;
      }>(url);
      return res.data.data;
    },
    onSuccess: (resData) => {
      setData(resData);
      if (!resData.aiAvailable) {
        toast("AI advisory inactive; displaying deterministic M4 risk view.", {
          icon: "ℹ️",
        });
      }
    },
    onError: (err: unknown) => {
      const msg =
        err instanceof Error ? err.message : "Failed to run AI review";
      toast.error(msg);
    },
  });

  const handleRunReview = () => {
    reviewMutation.mutate(quotationId);
  };

  const isPending = reviewMutation.isPending;
  const result = data?.result;

  return (
    <div
      id={`ai-review-panel-${quotationId}`}
      className="relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-surface/80 p-5 shadow-sm backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              AI Discount Advisory (Agent 1)
            </h3>
            <p className="text-xs text-muted-foreground">
              Evaluates margin health against M3 policies and past approved
              quotes.
            </p>
          </div>
        </div>

        <Button
          id="btn-run-ai-review"
          size="sm"
          variant="outline"
          onClick={handleRunReview}
          disabled={isPending}
          className="text-xs"
        >
          {isPending ? (
            <>
              <Spinner className="mr-1.5 size-3.5" />
              Evaluating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1.5 size-3.5" />
              {data ? "Re-evaluate" : "Run AI Review"}
            </>
          )}
        </Button>
      </div>

      {/* Initial Call-to-Action if not yet run */}
      {!data && !isPending && (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Request an automated AI advisory analysis for quotation{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-foreground">
              {quotationId}
            </code>
            .
          </p>
          <Button size="sm" onClick={handleRunReview} className="text-xs">
            <Sparkles className="mr-1.5 size-3.5" />
            Analyze Quotation Risk
          </Button>
        </div>
      )}

      {/* Degradation / AI Off fallback */}
      {data && !data.aiAvailable && (
        <div className="space-y-3 rounded-xl border border-border bg-surface-muted/30 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Deterministic M4 Risk Breakdown (AI Inactive)
          </div>
          <p className="text-xs text-muted-foreground">
            AI advisory is currently disabled or at monthly budget limit. Human
            approval decisions remain 100% functional via standard M4/M5 policy
            gates.
          </p>
          <div className="rounded-lg border border-border/60 bg-surface p-3 text-xs">
            <span className="font-semibold text-foreground">
              Governance Fallback Rule:
            </span>
            <ul className="mt-1 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Category discount ceilings are strictly enforced.</li>
              <li>
                Required approval chain calculated deterministically by M4
                engine.
              </li>
              <li>No automated adjustments applied.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Active AI Advisory View */}
      {data?.aiAvailable && result && (
        <div className="space-y-4">
          {/* Recommendation & Confidence Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted/50 p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Recommendation:
              </span>
              {result.recommendation === "APPROVE" && (
                <Badge
                  tone="success"
                  className="flex items-center gap-1 text-xs"
                >
                  <CheckCircle2 className="size-3.5" />
                  APPROVE
                </Badge>
              )}
              {result.recommendation === "ADJUST" && (
                <Badge
                  tone="warning"
                  className="flex items-center gap-1 text-xs"
                >
                  <Sliders className="size-3.5" />
                  ADJUST
                </Badge>
              )}
              {result.recommendation === "REJECT" && (
                <Badge
                  tone="danger"
                  className="flex items-center gap-1 text-xs"
                >
                  <AlertOctagon className="size-3.5" />
                  REJECT
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-semibold text-foreground">
                {Math.round(result.confidence * 100)}%
              </span>
              <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(result.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Rationale Narrative */}
          <div className="rounded-xl border border-border/60 bg-surface p-3.5">
            <span className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Advisory Rationale
            </span>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {result.rationale}
            </p>
          </div>

          {/* Suggested Adjustments */}
          {result.suggestedAdjustments &&
            result.suggestedAdjustments.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-surface p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
                  <Sliders className="size-3.5 text-warning" />
                  Suggested Line Adjustments
                </span>
                <div className="space-y-1.5">
                  {result.suggestedAdjustments.map((adj) => (
                    <div
                      key={adj.lineId}
                      className="flex items-center justify-between rounded-lg bg-surface-muted/40 p-2 text-xs"
                    >
                      <div>
                        <span className="font-mono font-medium text-foreground">
                          Line: {adj.lineId}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          Target Discount:{" "}
                          <strong className="text-warning-dark dark:text-warning-light">
                            {adj.toDiscountPct}%
                          </strong>
                        </span>
                      </div>
                      {onApplyAdjustment && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() =>
                            void onApplyAdjustment(
                              adj.lineId,
                              adj.toDiscountPct,
                            )
                          }
                        >
                          Apply Adjustment
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Similar Approved Deals */}
          {result.similarApprovedDeals &&
            result.similarApprovedDeals.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border/60 bg-surface p-3.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
                  <TrendingUp className="size-3.5 text-primary" />
                  Similar Past Approved Deals (RAG)
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {result.similarApprovedDeals.map((deal) => (
                    <div
                      key={deal.quotationId}
                      className="space-y-1 rounded-lg bg-surface-muted/40 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-muted-foreground">
                          {deal.quotationId}
                        </span>
                        <Badge tone="neutral" className="text-xs uppercase">
                          {deal.customerTier}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Discount: {deal.orderDiscountPct}%</span>
                        <span className="font-medium text-success">
                          {deal.outcome}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Non-Negotiable Governance Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-warning-dark dark:text-warning-light">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <strong className="font-semibold">
                Suggestion only — you decide.
              </strong>
              <p className="mt-0.5 text-muted-foreground">
                AI cannot approve or modify quotations. Applying adjustments
                re-enters the M5 edit flow and triggers full M4 risk governance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
