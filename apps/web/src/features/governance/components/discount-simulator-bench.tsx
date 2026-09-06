import { useState } from "react";
import type {
  ApprovalLevel,
  CustomerTier,
  DiscountSimulationResult,
  ProductCategory,
} from "@template/shared";
import { Calculator, CheckCircle2, HelpCircle, Play, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDiscountSimulation } from "@/features/governance/hooks/use-governance";

export function DiscountSimulatorBench() {
  const [tier, setTier] = useState<CustomerTier>("SILVER");
  const [category, setCategory] = useState<ProductCategory>("HARDWARE");
  const [discountPct, setDiscountPct] = useState<string>("18.0");

  const [result, setResult] = useState<DiscountSimulationResult | null>(null);

  const simulateMutation = useDiscountSimulation();

  const handleSimulate = () => {
    const num = parseFloat(discountPct);
    if (isNaN(num) || num < 0 || num > 100) return;

    simulateMutation.mutate(
      {
        customerTier: tier,
        category,
        requestedDiscountPct: num,
      },
      {
        onSuccess: (res) => setResult(res),
      },
    );
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Calculator className="size-4 text-primary" /> Discount simulator
          </h2>
          <p className="text-xs text-muted-foreground">
            Test how policies, excess calculations, and routing play out against
            your thresholds before drafting a deal.
          </p>
        </div>
        <Badge tone="primary">Real-Time Engine</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Input Parameters */}
        <div className="space-y-4 lg:col-span-5">
          <div className="space-y-4 rounded-lg border border-border bg-surface-muted/30 p-4">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Simulation Inputs
            </h3>

            {/* Customer Tier */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Customer Standing Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["BRONZE", "SILVER", "GOLD"] as const).map((t) => (
                  <button
                    key={t}
                    className={`rounded-lg border p-2 text-xs font-semibold transition-all ${
                      tier === t
                        ? "border-primary bg-primary-light/20 text-primary-dark shadow-xs"
                        : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                    }`}
                    type="button"
                    onClick={() => setTier(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Category */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Product Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["HARDWARE", "SERVICES", "SUBSCRIPTIONS"] as const).map(
                  (c) => (
                    <button
                      key={c}
                      className={`truncate rounded-lg border p-2 text-xs font-semibold transition-all ${
                        category === c
                          ? "border-secondary bg-secondary-light/20 text-secondary-dark shadow-xs"
                          : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"
                      }`}
                      type="button"
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Requested Discount */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">Requested Line Discount</span>
                <span className="font-mono font-semibold text-primary">
                  {discountPct}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
                  max={50}
                  min={0}
                  step={0.5}
                  type="range"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                />
                <div className="relative w-20">
                  <Input
                    className="h-9 w-full pr-5 text-right font-mono text-sm"
                    max={100}
                    min={0}
                    step={0.5}
                    type="number"
                    value={discountPct}
                    onChange={(e) => setDiscountPct(e.target.value)}
                  />
                  <span className="pointer-events-none absolute top-2 right-2 text-xs font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={simulateMutation.isPending}
              size="sm"
              variant="primary"
              onClick={handleSimulate}
            >
              <Play className="mr-1.5 size-3.5 fill-current" />
              {simulateMutation.isPending
                ? "Evaluating..."
                : "Run Risk Simulation"}
            </Button>
          </div>
        </div>

        {/* Right: Simulation Output & Rationale */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="flex h-full flex-col justify-between space-y-4 rounded-lg border border-border bg-surface p-5">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Governance Analysis
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">
                      {result.matchedRuleName}
                    </h4>
                  </div>
                  <Badge
                    tone={
                      result.isAutoApproved
                        ? "success"
                        : result.requiredApprovers.includes("FINANCE")
                          ? "danger"
                          : "warning"
                    }
                  >
                    {result.isAutoApproved
                      ? "Auto-Approved"
                      : result.requiredApprovers.includes("FINANCE")
                        ? "Dual Escalation"
                        : "Manager Escalation"}
                  </Badge>
                </div>

                {/* Grid metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-surface-muted/40 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Tier Cap ({tier})
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold text-foreground">
                      {result.tierCapPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-muted/40 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Category Cap
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold text-foreground">
                      {result.categoryCapPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-muted/40 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Applicable Cap
                    </div>
                    <div className="mt-1 font-mono text-sm font-semibold text-primary">
                      {result.applicableCapPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-muted/40 p-2.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Overage / Excess
                    </div>
                    <div
                      className={`mt-1 font-mono text-sm font-semibold ${
                        result.excessDiscountPct > 0
                          ? "text-danger-dark"
                          : "text-success-dark"
                      }`}
                    >
                      {result.excessDiscountPct > 0 ? "+" : ""}
                      {result.excessDiscountPct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Score and Routing */}
                <div className="mt-4 rounded-lg border border-border bg-surface-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Zap className="size-3.5 text-primary" /> Risk score
                      </div>
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {result.blendedRiskScore.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <div className="mb-1 text-xs text-muted-foreground">
                        Required Approvers
                      </div>
                      <div className="flex items-center gap-1.5">
                        {result.isAutoApproved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-dark">
                            <CheckCircle2 className="size-4" /> Zero Escalation
                          </span>
                        ) : (
                          result.requiredApprovers.map((lvl: ApprovalLevel) => (
                            <Badge
                              key={lvl}
                              tone={lvl === "FINANCE" ? "secondary" : "primary"}
                            >
                              {lvl === "FINANCE"
                                ? "Finance Lead"
                                : "Sales Manager"}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Explanation Note */}
              <div className="flex items-start gap-2 rounded-lg bg-surface-muted/40 p-3 text-xs text-muted-foreground">
                <HelpCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  {result.isAutoApproved
                    ? `The requested discount of ${discountPct}% is at or below the enforced ceiling of ${result.applicableCapPct}%. Deals meeting this criteria automatically pass without routing delay.`
                    : `The requested discount of ${discountPct}% exceeds the enforced ceiling of ${result.applicableCapPct}% by ${result.excessDiscountPct}%. This produces a risk score of ${result.blendedRiskScore}, routing this quote to ${result.requiredApprovers.join(" and ")}.`}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-60 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
              <Calculator className="mb-2 size-8 text-muted-foreground/50" />
              <p className="text-sm">
                Configure discount inputs and click "Run Risk Simulation" to
                observe live rule evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
