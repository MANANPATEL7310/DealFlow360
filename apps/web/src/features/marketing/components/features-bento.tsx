import {
  ShieldAlert,
  Sparkles,
  Truck,
  CreditCard,
  Activity,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

export function FeaturesBento() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-background py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <span>Built for modern sales ops</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything your quote-to-cash flow needs
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            DealFlow360 replaces scattered spreadsheets, manual manager
            sign-offs, and disconnected fulfillment tools with one connected
            system.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Blended Risk Engine (Double width on large screens) */}
          <SpotlightCard className="border border-border/70 p-7 shadow-lg transition-all hover:border-primary/30 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldAlert className="size-6" />
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Discount governance
              </span>
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              Discount risk engine
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Never let margin erode silently. DealFlow360 sets effective
              ceilings by combining customer tiers (Bronze, Silver, Gold) with
              category limits, then scores the whole order to catch discount
              leaks spread across many lines — even when each line looks
              harmless.
            </p>

            <div className="grid gap-4 rounded-xl border border-border bg-surface-muted/50 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  Catches oversized lines
                </p>
                <p className="text-xs text-muted-foreground">
                  Flags any single line that exceeds its category or tier cap.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  Catches spread-out leaks
                </p>
                <p className="text-xs text-muted-foreground">
                  Weighs small discount overages across the full order value.
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 2: Live Upsell & Cross-Sell */}
          <SpotlightCard
            spotlightColor="color-mix(in srgb, var(--secondary) 20%, transparent)"
            className="flex flex-col justify-between p-7 shadow-lg transition-all"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <Sparkles className="size-6" />
                </div>
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                  Live Margin Boost
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                Live Upsell &amp; Cross-Sell
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Suggest complementary products, service packages, and recurring
                maintenance directly within the quotation builder with instant
                margin delta preview.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-surface-muted/50 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Premium Support Add-on:
                </span>
                <span className="font-bold text-secondary">
                  +6.2% Margin Delta
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-secondary">
                <CheckCircle2 className="size-4" />
                <span>One-click line insertion</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 3: Multi-Warehouse Fulfillment */}
          <SpotlightCard className="flex flex-col justify-between p-7 shadow-lg transition-all">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="size-6" />
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-foreground">
                  Fulfillment
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                Multi-Warehouse Split
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Intelligently routes confirmed line items to regional warehouses
                based on stock levels, minimizes split shipping freight costs,
                and automatically logs backorders.
              </p>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between rounded-lg bg-surface-muted/60 p-2">
                <span className="text-muted-foreground">
                  Warehouse Central:
                </span>
                <span className="font-semibold text-foreground">
                  60 Units (Ready)
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-surface-muted/60 p-2">
                <span className="text-muted-foreground">Warehouse West:</span>
                <span className="font-semibold text-warning">
                  20 Units (Backorder)
                </span>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 4: Hybrid Invoicing */}
          <SpotlightCard
            spotlightColor="color-mix(in srgb, var(--secondary) 20%, transparent)"
            className="flex flex-col justify-between p-7 shadow-lg transition-all"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                  <CreditCard className="size-6" />
                </div>
                <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                  Hybrid Billing
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                Unified Hybrid Invoicing
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Handle hardware capital expenditures and recurring software
                subscriptions on the exact same quotation. Includes proration
                engines and credit notes.
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border border-border bg-surface-muted/50 p-3.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Hardware Equipment:</span>
                <span className="font-semibold text-foreground">
                  $12,500 (One-Time)
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cloud Platform License:</span>
                <span className="font-semibold text-secondary">
                  $890/mo (Recurring)
                </span>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 5: Deal Health & Anomaly Radar */}
          <SpotlightCard
            spotlightColor="color-mix(in srgb, var(--warning) 20%, transparent)"
            className="flex flex-col justify-between p-7 shadow-lg transition-all"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Activity className="size-6" />
                </div>
                <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                  Deal Health
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                Deal Health &amp; Anomaly Radar
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                Continuous background surveillance flags stalled quotations,
                abnormal margin erosion, and fulfillment delays before deals go
                cold.
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs">
              <TrendingUp className="size-4 shrink-0 text-warning" />
              <span className="text-muted-foreground">
                Instant escalation and manager nudging via audit trail
              </span>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
