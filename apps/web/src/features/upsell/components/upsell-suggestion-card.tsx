import type { UpsellSuggestionItem } from "@template/shared";
import { Plus, Sparkles, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface UpsellSuggestionCardProps {
  suggestion: UpsellSuggestionItem;
  isAdding: boolean;
  onAdd: (productId: string) => void;
  onDismiss: (productId: string) => void;
}

export function UpsellSuggestionCard({
  suggestion,
  isAdding,
  onAdd,
  onDismiss,
}: UpsellSuggestionCardProps) {
  const {
    product,
    marginDeltaPct,
    resultingOrderMarginPct,
    promoted,
    coPurchaseScore,
  } = suggestion;

  const priceFormatted = (product.basePrice / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isPositiveMargin = marginDeltaPct >= 0;
  const matchPct = Math.round(coPurchaseScore * 100);

  return (
    <div className="surface-card flex flex-col justify-between gap-3 rounded-xl border border-border p-4 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      <div className="space-y-2">
        {/* Header row: Title, Badges, Price */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="text-sm font-bold text-foreground">
                {product.name}
              </h4>
              {promoted && (
                <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-500">
                  <Sparkles className="mr-1 size-3" /> Promoted
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {product.category} • {product.unit}
            </p>
          </div>

          <div className="text-right">
            <span className="font-mono text-sm font-bold text-foreground">
              ${priceFormatted}
            </span>
          </div>
        </div>

        {/* Product brief */}
        {product.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        )}

        {/* Metric Badges: Affinity & Margin Delta */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge tone="primary" className="gap-1 font-medium">
            <Zap className="size-3" />
            {matchPct}% Co-Purchase Match
          </Badge>

          <Badge
            tone={isPositiveMargin ? "success" : "warning"}
            className="gap-1 font-medium"
          >
            {isPositiveMargin ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {isPositiveMargin
              ? `+${marginDeltaPct.toFixed(1)}%`
              : `${marginDeltaPct.toFixed(1)}%`}{" "}
            Margin Delta
          </Badge>

          <span className="text-xs text-muted-foreground">
            (Deal ~{resultingOrderMarginPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="ghost"
          disabled={isAdding}
          onClick={() => onDismiss(product.id)}
          className="h-8 gap-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
          Dismiss
        </Button>

        <Button
          size="sm"
          variant="primary"
          disabled={isAdding}
          onClick={() => onAdd(product.id)}
          className="h-8 gap-1 rounded-lg text-xs font-semibold shadow-xs"
        >
          {isAdding ? (
            <Spinner className="size-3.5" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Add to Quote
        </Button>
      </div>
    </div>
  );
}
