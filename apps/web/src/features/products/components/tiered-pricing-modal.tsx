import { type Product } from "@template/shared";
import {
  AlertTriangle,
  CheckCircle2,
  Percent,
  TrendingDown,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { productsApi } from "@/features/products/api/products-api";
import { cn } from "@/lib/cn";

interface TieredPricingModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TieredPricingModal({
  product,
  isOpen,
  onClose,
}: TieredPricingModalProps) {
  if (!isOpen || !product) return null;

  const schedules = productsApi.getTierSchedules(product);
  const baseSchedule = schedules.find((s) => s.tier === "BASE")!;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-3xl space-y-6 border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Tiered Volume Matrix
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {product.category.toLowerCase()} • {product.unit}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {product.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Pre-calculated partner tier pricing floors and real-time gross
              margin impact.
            </p>
          </div>
          <button
            className="hover:bg-muted rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Cost & Base Price Context */}
        <div className="bg-muted/40 grid grid-cols-3 gap-3 rounded-lg border border-border p-3 text-xs">
          <div>
            <span className="text-muted-foreground">Unit Cost (COGS):</span>
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(product.unitCost)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Standard List Price:</span>
            <p className="text-sm font-semibold text-primary">
              {formatPrice(product.basePrice)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Base Catalog Margin:</span>
            <p className="text-sm font-semibold text-emerald-500">
              {baseSchedule.marginPct}%
            </p>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {schedules.map((schedule) => {
            const isBase = schedule.tier === "BASE";
            const marginDelta =
              Math.round((schedule.marginPct - baseSchedule.marginPct) * 10) /
              10;
            const isLowMargin = schedule.marginPct < 20;

            return (
              <div
                key={schedule.tier}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 transition-all",
                  isBase
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "bg-card/60 border-border hover:border-primary/30",
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      {schedule.label}
                    </span>
                    {schedule.discountPct > 0 && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500">
                        -{schedule.discountPct}%
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {formatPrice(schedule.unitPrice)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      per {product.unit} (min {schedule.minQuantity})
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Margin:</span>
                    <span
                      className={cn(
                        "font-bold",
                        schedule.marginPct >= 30
                          ? "text-emerald-500"
                          : schedule.marginPct >= 20
                            ? "text-amber-500"
                            : "text-rose-500",
                      )}
                    >
                      {schedule.marginPct}%
                    </span>
                  </div>

                  {!isBase && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Erosion:</span>
                      <span className="flex items-center gap-0.5 text-rose-500">
                        <TrendingDown className="size-3" />
                        {marginDelta}%
                      </span>
                    </div>
                  )}

                  {isLowMargin ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
                      <AlertTriangle className="size-3" />
                      <span>Near floor</span>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="size-3" />
                      <span>Compliant</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Percent className="size-4 text-primary" />
            <span>
              Prices dynamically resolve during quotation drafting based on
              account tier.
            </span>
          </div>
          <button
            className="bg-card hover:bg-muted rounded-lg border border-border px-4 py-1.5 font-semibold text-foreground"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
}
