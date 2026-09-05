import { useState, useMemo } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Layers,
} from "lucide-react";
import { appRoutes } from "@template/shared";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function HeroSection() {
  // Interactive Simulator state
  const [customerTier, setCustomerTier] = useState<"BRONZE" | "SILVER" | "GOLD">("SILVER");
  const [category, setCategory] = useState<"HARDWARE" | "SERVICES" | "SUBSCRIPTION">("SERVICES");
  const [basePrice] = useState<number>(4500); // $4,500 base price
  const [quantity, setQuantity] = useState<number>(5);
  const [discountPct, setDiscountPct] = useState<number>(14);

  // Business logic mirroring DealFlow360 PS §10
  const tierCeilings = { BRONZE: 5, SILVER: 10, GOLD: 15 };
  const categoryCeilings = { HARDWARE: 15, SERVICES: 10, SUBSCRIPTION: 20 };

  const effectiveCeiling = Math.min(
    tierCeilings[customerTier],
    categoryCeilings[category],
  );

  const violationPoints = Math.max(0, discountPct - effectiveCeiling);
  const grossTotal = basePrice * quantity;
  const discountAmount = grossTotal * (discountPct / 100);
  const netTotal = grossTotal - discountAmount;
  
  // Cost assumption to simulate realistic margin %
  const estimatedCost = grossTotal * 0.55;
  const marginPct = useMemo(() => {
    return Math.round(((netTotal - estimatedCost) / netTotal) * 100);
  }, [netTotal, estimatedCost]);

  // Routing band according to DealFlow360 specs
  const routingStatus = useMemo(() => {
    if (violationPoints === 0) {
      return {
        level: "AUTO_APPROVED",
        label: "Auto-Approved",
        description: "Within policy ceiling. Quotation directly approved.",
        tone: "success",
      };
    } else if (violationPoints <= 4) {
      return {
        level: "SALES_MANAGER",
        label: "Level 1: Sales Manager Approval",
        description: `Exceeds ${effectiveCeiling}% ceiling by ${violationPoints}%. Requires manager review.`,
        tone: "warning",
      };
    } else {
      return {
        level: "FINANCE_AND_MANAGER",
        label: "Level 2: Sales Manager → Finance Approval",
        description: `Severe discount violation (${violationPoints}% over ceiling). Dual approval required.`,
        tone: "danger",
      };
    }
  }, [violationPoints, effectiveCeiling]);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background soft ambient orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="size-80 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Hero Left: Value Proposition */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary backdrop-blur-md">
              <span className="flex size-2 animate-pulse rounded-full bg-primary" />
              <span>Intelligent Self-Governing Sales Operations</span>
            </div>

            <h1 className="leading-1.12 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              From Complex Quotes to Cash with{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Autonomous Governance
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Empower sales reps to configure multi-line deals in seconds while DealFlow360’s
              blended-discount risk engine, multi-warehouse fulfillment split, and hybrid billing engine
              safeguard margins without manual bottlenecks.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 lg:justify-start">
              <Link to={appRoutes.app}>
                <Button size="lg" className="gap-2.5 px-6 font-semibold shadow-xl shadow-primary/25">
                  Launch Sales Workspace
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#simulator">
                <Button variant="outline" size="lg" className="gap-2 px-5">
                  <Sliders className="size-4 text-primary" />
                  Try Risk Simulator
                </Button>
              </a>
            </div>

            {/* Micro value badges */}
            <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/60 p-3 text-left backdrop-blur-md">
                <ShieldCheck className="size-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Zero Discount Leakage</p>
                  <p className="text-xs text-muted-foreground">Blended risk scoring</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-surface/60 p-3 text-left backdrop-blur-md">
                <Layers className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Multi-Warehouse Split</p>
                  <p className="text-xs text-muted-foreground">Automated stock routing</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-surface/60 p-3 text-left backdrop-blur-md sm:col-span-1">
                <TrendingUp className="size-5 shrink-0 text-secondary" />
                <div>
                  <p className="text-xs font-bold text-foreground">Hybrid Cash Flow</p>
                  <p className="text-xs text-muted-foreground">One-time + recurring billing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right: Interactive Live Margin & Risk Simulator */}
          <div id="simulator" className="lg:col-span-5">
            <SpotlightCard className="relative border border-border/70 p-6 shadow-2xl backdrop-blur-2xl transition-all hover:border-primary/30">
              {/* Simulator Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Zap className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Interactive Risk Engine</h3>
                    <p className="text-xs text-muted-foreground">Live quotation calculation preview</p>
                  </div>
                </div>
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  PS §10 Rule
                </span>
              </div>

              {/* Controls */}
              <div className="mt-5 space-y-4">
                {/* Customer Tier selector */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Customer Tier</span>
                    <span className="font-semibold text-foreground">
                      Max: {tierCeilings[customerTier]}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["BRONZE", "SILVER", "GOLD"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCustomerTier(t)}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                          customerTier === t
                            ? "bg-primary text-white shadow-sm"
                            : "border border-border bg-surface-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category selector */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Product Line Category</span>
                    <span className="font-semibold text-foreground">
                      Cap: {categoryCeilings[category]}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["HARDWARE", "SERVICES", "SUBSCRIPTION"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCategory(c)}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                          category === c
                            ? "bg-primary text-white shadow-sm"
                            : "border border-border bg-surface-muted/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 pt-1">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Applied Line Discount</span>
                      <span className={`font-bold ${discountPct > effectiveCeiling ? "text-warning" : "text-foreground"}`}>
                        {discountPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={35}
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
                    />
                    <div className="mt-0.5 flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-semibold text-primary">Effective Ceiling: {effectiveCeiling}%</span>
                      <span>35%</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Order Quantity</span>
                      <span className="font-bold text-foreground">{quantity} units</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-primary"
                    />
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="space-y-2 rounded-xl border border-border bg-surface-muted/50 p-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross Value:</span>
                    <span className="font-medium text-foreground">
                      <AnimatedCounter value={grossTotal} prefix="$" />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Discount:</span>
                    <span className="font-medium text-danger">
                      -<AnimatedCounter value={Math.round(discountAmount)} prefix="$" />
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                    <span className="text-foreground">Net Proposal Value:</span>
                    <span className="text-foreground">
                      <AnimatedCounter value={Math.round(netTotal)} prefix="$" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1.5">
                    <span className="text-muted-foreground">Estimated Margin:</span>
                    <span className={`rounded px-2 py-0.5 font-bold ${marginPct >= 35 ? "bg-secondary/15 text-secondary" : "bg-warning/15 text-warning"}`}>
                      <AnimatedCounter value={marginPct} suffix="% Margin" />
                    </span>
                  </div>
                </div>

                {/* Live Governance Routing Output */}
                <div
                  className={`rounded-xl border p-3.5 transition-all ${
                    routingStatus.tone === "success"
                      ? "border-secondary/30 bg-secondary/10"
                      : routingStatus.tone === "warning"
                      ? "border-warning/30 bg-warning/10"
                      : "border-danger/30 bg-danger/10"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {routingStatus.tone === "success" ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-secondary" />
                    ) : routingStatus.tone === "warning" ? (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
                    )}
                    <div>
                      <p
                        className={`text-xs font-bold ${
                          routingStatus.tone === "success"
                            ? "text-secondary"
                            : routingStatus.tone === "warning"
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      >
                        {routingStatus.label}
                      </p>
                      <p className="mt-0.5 text-xs leading-normal text-muted-foreground">
                        {routingStatus.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
