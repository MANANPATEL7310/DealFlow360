import { useState, useEffect } from "react";
import type { AiFulfillmentProposal, ManualSplitInput } from "@template/shared";
import {
  Sparkles,
  Truck,
  TrendingDown,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchAiFulfillmentProposal } from "@/features/ai/services/ai-api";

interface AiFulfillmentPlannerCardProps {
  quotationId: string;
  isPlanAccepted?: boolean;
  onApplyPlan: (splits: ManualSplitInput[]) => Promise<void> | void;
  isApplying?: boolean;
}

export function AiFulfillmentPlannerCard({
  quotationId,
  isPlanAccepted = false,
  onApplyPlan,
  isApplying = false,
}: AiFulfillmentPlannerCardProps) {
  const [proposal, setProposal] = useState<AiFulfillmentProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const loadProposal = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetchAiFulfillmentProposal(quotationId);
      setProposal(res);
    } catch (err) {
      console.error("Failed to load AI fulfillment proposal:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchAiFulfillmentProposal(quotationId)
      .then((res) => {
        if (mounted) {
          setProposal(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error("Failed to load AI fulfillment proposal:", err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [quotationId]);

  const handleApply = async () => {
    if (!proposal) return;
    const manualSplits: ManualSplitInput[] = proposal.proposedSplits.map(
      (s) => ({
        warehouseId: s.warehouseId,
        productId: s.productId,
        qty: s.qty,
      }),
    );

    try {
      await onApplyPlan(manualSplits);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to apply AI fulfillment plan:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="surface-card rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-secondary/5 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Spinner className="size-5 text-primary" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">
              Agent 3: Calculating Multi-Warehouse Allocation & Freight
              Trade-offs...
            </div>
            <div className="text-xs text-muted-foreground">
              Evaluating warehouse inventory proximity, backorder lead times,
              and shipping route efficiencies.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <div className="surface-card rounded-2xl border border-primary/20 bg-card p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Agent 3: AI Fulfillment & Multi-Warehouse Planner
              </h3>
              <Badge tone="primary" className="text-xs">
                Claude 4.5 Sonnet
              </Badge>
              <Badge tone="success" className="text-xs">
                {proposal.tradeoffScore}% Logistics Score
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Optimizes shipping routes, cuts transit time, and mitigates
              backorder delivery lag.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            tone="neutral"
            className="border border-border/80 px-2.5 py-1 text-xs font-semibold"
          >
            {proposal.estShipmentCount} Consolidations Planned
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => loadProposal(true)}
            disabled={isRefreshing}
            className="h-8 gap-1.5 rounded-lg px-2 text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Re-optimize
          </Button>
        </div>
      </div>

      {/* Rationale Callout */}
      <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-3.5 text-xs text-foreground/90">
        <div className="flex items-start gap-2">
          <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <span className="font-semibold text-primary">
              Logistics Strategy Rationale:{" "}
            </span>
            {proposal.rationale}
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Optimized Freight Est.</span>
            <TrendingDown className="size-4 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              ${(proposal.estShipmentCostMinor / 100).toFixed(2)}
            </span>
            <Badge tone="success" className="text-xs font-semibold">
              {proposal.costDeltaPct > 0
                ? `+${proposal.costDeltaPct}%`
                : `${proposal.costDeltaPct}%`}{" "}
              vs baseline
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Transit Benchmark</span>
            <Clock className="size-4 text-primary" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              ~{proposal.transitDaysBenchmark} Days
            </span>
            <span className="text-xs text-muted-foreground">
              Estimated Delivery Window
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Trade-off Efficiency</span>
            <Gauge className="size-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg font-bold text-foreground">
              {proposal.tradeoffScore} / 100
            </span>
            <span className="text-xs text-muted-foreground">
              Cost-Speed Optimization Index
            </span>
          </div>
        </div>
      </div>

      {/* Proposed Allocation Split Preview */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recommended Warehouse Splits
        </h4>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Warehouse Hub</th>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium text-center">
                  Allocated Qty
                </th>
                <th className="px-3 py-2 font-medium text-right">
                  Freight Est.
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {proposal.proposedSplits.map((s, idx) => (
                <tr
                  key={`${s.warehouseId}-${s.productId}-${idx}`}
                  className="hover:bg-muted/20"
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {s.warehouseName}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {s.productName}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-foreground">
                    {s.qty} units
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-foreground">
                    ${(s.shipmentCostMinor / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suggested Backorders (if any) */}
      {proposal.backorders && proposal.backorders.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Package className="size-4" />
            <span>
              AI Identified Backorders ({proposal.backorders.length} items)
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {proposal.backorders.map((b) => (
              <div
                key={b.productId}
                className="flex items-center justify-between text-xs text-foreground/80"
              >
                <span>
                  {b.productName} &middot;{" "}
                  <strong className="text-foreground">
                    {b.qtyOutstanding} units backordered
                  </strong>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Expected Delay ~{b.expectedDelayDays} days
                  </span>
                  <Badge tone="warning" className="text-xs">
                    Buffer Needed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HITL Notice if Manager Approval Required */}
      {proposal.requiresManagerApproval && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <span className="font-semibold">
              Managerial Override Approval Required:{" "}
            </span>
            Freight cost delta or warehouse reallocation threshold exceeded. A
            manager review will be staged upon applying.
          </div>
        </div>
      )}

      {/* Action Footer */}
      {!isPlanAccepted && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            Applying this plan will stage allocation splits into the fulfillment
            engine for stock confirmation.
          </span>

          <div className="flex items-center gap-2">
            {appliedSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                AI Allocation Applied!
              </div>
            )}
            <Button
              size="sm"
              variant="primary"
              disabled={isApplying || isRefreshing}
              onClick={handleApply}
              className="h-9 gap-2 rounded-xl text-xs font-semibold shadow-xs"
            >
              {isApplying ? (
                <Spinner className="size-3.5" />
              ) : (
                <ArrowRight className="size-3.5" />
              )}
              Apply AI Optimized Allocation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
