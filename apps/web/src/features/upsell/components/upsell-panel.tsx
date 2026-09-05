import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UpsellSuggestionCard } from "@/features/upsell/components/upsell-suggestion-card";
import { useAddUpsell, useUpsell } from "@/features/upsell/hooks/use-upsell";

interface UpsellPanelProps {
  quotationId: string;
  className?: string;
}

type TabFilter = "ALL" | "MARGIN_POSITIVE" | "PROMOTED";

export function UpsellPanel({ quotationId, className }: UpsellPanelProps) {
  const { data: suggestions = [], isLoading } = useUpsell(quotationId);
  const addMutation = useAddUpsell(quotationId);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<TabFilter>("ALL");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const visibleSuggestions = suggestions.filter(
    (s) => !dismissedIds.has(s.product.id),
  );

  const filteredSuggestions = visibleSuggestions.filter((s) => {
    if (filter === "MARGIN_POSITIVE") return s.marginDeltaPct >= 0;
    if (filter === "PROMOTED") return s.promoted;
    return true;
  });

  const handleDismiss = (productId: string) => {
    setDismissedIds((prev) => new Set(prev).add(productId));
  };

  const handleAdd = async (productId: string) => {
    setAddingId(productId);
    try {
      await addMutation.mutateAsync(productId);
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-36 w-full rounded-xl" />
          <Skeleton className="h-36 w-full rounded-xl" />
        </div>
      </Card>
    );
  }

  // If there are no recommendations available for this quotation cart
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={`space-y-4 p-6 ${className ?? ""}`}>
      {/* Header section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Intelligent Add-ons & Upsells
              </h3>
              <Badge tone="primary" className="text-xs font-semibold">
                {visibleSuggestions.length} Available
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Algorithmic recommendations matched to items currently in this quotation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          {!isCollapsed && visibleSuggestions.length > 0 && (
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-muted/40 p-1">
              <Button
                size="sm"
                variant={filter === "ALL" ? "primary" : "ghost"}
                className="h-7 rounded-lg text-xs"
                onClick={() => setFilter("ALL")}
              >
                All ({visibleSuggestions.length})
              </Button>
              <Button
                size="sm"
                variant={filter === "MARGIN_POSITIVE" ? "primary" : "ghost"}
                className="h-7 gap-1 rounded-lg text-xs"
                onClick={() => setFilter("MARGIN_POSITIVE")}
              >
                <TrendingUp className="size-3" />
                Margin Boosters
              </Button>
              <Button
                size="sm"
                variant={filter === "PROMOTED" ? "primary" : "ghost"}
                className="h-7 gap-1 rounded-lg text-xs"
                onClick={() => setFilter("PROMOTED")}
              >
                <Zap className="size-3" />
                Promoted
              </Button>
            </div>
          )}

          {/* Collapse Toggle */}
          <Button
            size="sm"
            variant="outline"
            className="size-8 rounded-lg p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
          >
            {isCollapsed ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Body: Grid of recommendations */}
      {!isCollapsed && (
        <div className="pt-1">
          {filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
              <CheckCircle2 className="mb-2 size-6 text-success/60" />
              <p className="font-semibold text-foreground">
                All recommendations in this filter applied or dismissed
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Switch filters or initialize more lines to discover complementary packages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredSuggestions.map((suggestion) => (
                <UpsellSuggestionCard
                  key={suggestion.product.id}
                  isAdding={addingId === suggestion.product.id}
                  onAdd={handleAdd}
                  onDismiss={handleDismiss}
                  suggestion={suggestion}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
