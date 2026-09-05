import { useState } from "react";
import { type Product, type ProductVariant } from "@template/shared";
import { Check, Cpu, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface VariantSelectorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VariantSelectorModal({
  product,
  isOpen,
  onClose,
}: VariantSelectorModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  if (!isOpen || !product) return null;

  const variants = product.variants;
  const activeVariant = variants.find((v) => v.id === selectedVariantId);

  const extraPrice = activeVariant?.extraPrice ?? 0;
  const resolvedPrice = product.basePrice + extraPrice;
  const resolvedMargin =
    resolvedPrice > 0
      ? Math.round(
          ((resolvedPrice - product.unitCost) / resolvedPrice) * 1000,
        ) / 10
      : 0;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <Card className="bg-card relative w-full max-w-lg space-y-6 border-border p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                Variant Configurator
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {product.category.toLowerCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {product.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              Select component specifications to resolve pricing and unit
              margins.
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

        {/* Variants List */}
        <div className="space-y-3">
          <label className="text-xs font-semibold tracking-wider text-foreground uppercase">
            Available Specification Options ({variants.length})
          </label>

          {variants.length === 0 ? (
            <div className="bg-muted/40 rounded-lg border border-border p-6 text-center text-xs text-muted-foreground">
              This product is sold as a standard SKU with no configurable
              variants.
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((v: ProductVariant) => {
                const isSelected = selectedVariantId === v.id;
                return (
                  <button
                    key={v.id}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "bg-card/60 hover:bg-muted/50 border-border hover:border-primary/40",
                    )}
                    type="button"
                    onClick={() =>
                      setSelectedVariantId(isSelected ? null : v.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "bg-muted border-border text-muted-foreground",
                        )}
                      >
                        {isSelected ? (
                          <Check className="size-4" />
                        ) : (
                          <Cpu className="size-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {v.attribute}
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {v.value}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {v.extraPrice === 0 ? (
                        <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Base Spec
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-1 text-xs font-bold text-primary">
                          <Plus className="size-3" />
                          {formatPrice(v.extraPrice)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Pricing Preview */}
        <div className="bg-muted/50 space-y-2 rounded-xl border border-border/80 p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Base List Price:</span>
            <span className="font-semibold text-foreground">
              {formatPrice(product.basePrice)}
            </span>
          </div>
          {extraPrice > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Variant Surcharge ({activeVariant?.value}):
              </span>
              <span className="font-semibold text-primary">
                +{formatPrice(extraPrice)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/60 pt-2 text-sm">
            <span className="font-bold text-foreground">
              Configured Unit Price:
            </span>
            <span className="text-base font-bold text-foreground">
              {formatPrice(resolvedPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Effective Gross Margin:
            </span>
            <span
              className={cn(
                "font-bold",
                resolvedMargin >= 30
                  ? "text-emerald-500"
                  : resolvedMargin >= 20
                    ? "text-amber-500"
                    : "text-rose-500",
              )}
            >
              {resolvedMargin}%
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
