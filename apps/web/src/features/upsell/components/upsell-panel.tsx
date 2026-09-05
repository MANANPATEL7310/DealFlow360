import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchAiStatus,
  fetchAiUpsellRecommendations,
} from "@/features/ai/services/ai-api";
import { DegradedModeBanner } from "@/features/ai/components/degraded-mode-banner";
import { UpsellSuggestionCard } from "@/features/upsell/components/upsell-suggestion-card";
import { useAddUpsell, useUpsell } from "@/features/upsell/hooks/use-upsell";
import type { AiUpsellRecommendation, AiUpsellTag } from "@template/shared";

interface UpsellPanelProps {
  quotationId: string;
  className?: string;
}

type TabFilter = "ALL" | "MARGIN_BOOST" | "ENTERPRISE";

export function UpsellPanel({ quotationId, className }: UpsellPanelProps) {
  // Global AI status check
  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: fetchAiStatus,
    staleTime: 1000 * 60,
  });

  const isAiActive = Boolean(aiStatus?.enabled);

  // Agent 2 AI recommendations query
  const {
    data: aiData,
    isLoading: isLoadingAi,
    isError: isAiError,
  } = useQuery({
    queryKey: ["ai", "upsell-recommendations", quotationId],
    queryFn: () => fetchAiUpsellRecommendations(quotationId),
    enabled: isAiActive && Boolean(quotationId),
    staleTime: 1000 * 30,
  });

  // Deterministic Document A fallback query
  const { data: deterministicSuggestions = [], isLoading: isLoadingDet } =
    useUpsell(quotationId);

  const addMutation = useAddUpsell(quotationId);

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<TabFilter>("ALL");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

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

  const getTagBadge = (tag: AiUpsellTag) => {
    switch (tag) {
      case "HIGHEST_MARGIN":
        return (
          <Badge tone="success" className="gap-1 font-semibold text-xs">
            <TrendingUp className="size-3" /> Margin Booster
          </Badge>
        );
      case "FREQUENTLY_PAIRED":
        return (
          <Badge tone="primary" className="gap-1 font-semibold text-xs">
            <Sparkles className="size-3" /> Frequently Paired
          </Badge>
        );
      case "ENTERPRISE_ADDON":
        return (
          <Badge tone="warning" className="gap-1 font-semibold text-xs">
            <Zap className="size-3" /> Enterprise Add-on
          </Badge>
        );
      case "REDUCED_RISK":
      default:
        return (
          <Badge tone="secondary" className="gap-1 font-semibold text-xs">
            <ShieldCheck className="size-3" /> SLA & Risk Shield
          </Badge>
        );
    }
  };

  // Render AI Recommendations View if active and available
  if (isAiActive && !isAiError) {
    if (isLoadingAi) {
      return (
        <Card className="space-y-4 p-6 border-primary/20 bg-card/60 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-primary/20" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        </Card>
      );
    }

    const aiSuggestions = (aiData?.suggestions ?? []).filter(
      (s) => !dismissedIds.has(s.productId),
    );

    const filteredAi = aiSuggestions.filter((s) => {
      if (filter === "MARGIN_BOOST") return s.tag === "HIGHEST_MARGIN";
      if (filter === "ENTERPRISE")
        return s.tag === "ENTERPRISE_ADDON" || s.tag === "REDUCED_RISK";
      return true;
    });

    if (aiSuggestions.length === 0) {
      return null;
    }

    return (
      <Card
        className={`space-y-5 rounded-2xl border-primary/30 bg-gradient-to-br from-primary/5 via-card/90 to-card p-6 shadow-sm backdrop-blur-xs ${className ?? ""}`}
      >
        {/* Header section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground sm:text-base">
                  Agent 2 · AI Product & Upsell Recommendations
                </h3>
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                  <Cpu className="size-2.5" />
                  Claude 4.5
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {aiData?.cartSummary ??
                  "Autonomous affinity ranking matched to quotation basket composition"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Filter tabs */}
            {!isCollapsed && (
              <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-background/80 p-1">
                <Button
                  size="sm"
                  variant={filter === "ALL" ? "primary" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setFilter("ALL")}
                >
                  All ({aiSuggestions.length})
                </Button>
                <Button
                  size="sm"
                  variant={filter === "MARGIN_BOOST" ? "primary" : "ghost"}
                  className="h-7 gap-1 text-xs"
                  onClick={() => setFilter("MARGIN_BOOST")}
                >
                  <TrendingUp className="size-3" /> Margin Boosters
                </Button>
                <Button
                  size="sm"
                  variant={filter === "ENTERPRISE" ? "primary" : "ghost"}
                  className="h-7 gap-1 text-xs"
                  onClick={() => setFilter("ENTERPRISE")}
                >
                  <Zap className="size-3" /> Enterprise
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

        {/* Body: AI Suggested Cards Grid */}
        {!isCollapsed && (
          <div className="space-y-4">
            {filteredAi.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="mb-2 size-6 text-emerald-500/80" />
                <p className="font-semibold text-foreground">
                  All recommendations in this view applied or dismissed
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredAi.map((item: AiUpsellRecommendation) => {
                  const priceFormatted = (
                    item.unitPriceMinor / 100
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });
                  const isAddingThis = addingId === item.productId;

                  return (
                    <div
                      key={item.productId}
                      className="surface-card group flex flex-col justify-between rounded-xl border border-border/80 bg-background/80 p-4 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Top row: Title, Fit Badge, Dismiss */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-sm font-bold text-foreground">
                                {item.productName}
                              </h4>
                              {getTagBadge(item.tag)}
                            </div>
                            <span className="text-xs text-muted-foreground uppercase font-mono">
                              {item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {item.fitScore}% Fit
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDismiss(item.productId)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              aria-label="Dismiss recommendation"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* AI Rationale Box */}
                        <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5 text-xs text-muted-foreground leading-relaxed">
                          <span className="font-semibold text-foreground mr-1">
                            AI Rationale:
                          </span>
                          {item.reason}
                        </div>
                      </div>

                      {/* Bottom row: Price, Margin Delta, Add Button */}
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                        <div>
                          <div className="font-mono font-bold text-foreground">
                            ${priceFormatted}
                          </div>
                          <div className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                            +{item.marginDeltaPct}% Margin Delta
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="primary"
                          disabled={isAddingThis}
                          onClick={() => handleAdd(item.productId)}
                          className="h-8 gap-1.5 rounded-lg text-xs shadow-xs"
                        >
                          {isAddingThis ? (
                            <>
                              <Spinner className="size-3.5" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="size-3.5" />
                              <span>Add to Quotation</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Document A Master Invariant Note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="size-3.5 text-primary shrink-0" />
              <span>
                <strong>Document A Governance:</strong> Adding an item triggers
                deterministic margin & tier ceiling re-calculation in real-time.
              </span>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ── Degraded / Deterministic Fallback Mode ──────────────────────────────────
  if (isLoadingDet) {
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

  const visibleSuggestions = deterministicSuggestions.filter(
    (s) => !dismissedIds.has(s.product.id),
  );

  if (visibleSuggestions.length === 0) {
    return null;
  }

  return (
    <Card className={`space-y-4 p-6 ${className ?? ""}`}>
      {/* Degraded banner when AI disabled */}
      {aiStatus && !aiStatus.enabled && (
        <DegradedModeBanner status={aiStatus} compact />
      )}

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
              Deterministic M6 co-purchase recommendations matched to current
              lines
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          className="size-8 rounded-lg p-0 self-end sm:self-auto"
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

      {!isCollapsed && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleSuggestions.map((suggestion) => (
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
    </Card>
  );
}
