import { useState } from "react";
import type {
  ReportFilters,
  AiNaturalLanguageQueryResponse,
} from "@template/shared";
import {
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  Percent,
  DollarSign,
  Compass,
  ArrowRight,
  Filter,
  Lightbulb,
  X,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { fetchAiNaturalLanguageReportQuery } from "@/features/ai/services/ai-api";

interface AiSalesInsightsCardProps {
  currentFilters: ReportFilters;
  onApplyFilters: (filters: ReportFilters) => void;
}

const QUICK_PROMPTS = [
  "Hardware deals with heavy discount concessions",
  "High margin Q3 deals above target floor",
  "SaaS subscription recurring yield vs services",
  "Stalled negotiations and pipeline friction",
];

export function AiSalesInsightsCard({
  currentFilters,
  onApplyFilters,
}: AiSalesInsightsCardProps) {
  const [prompt, setPrompt] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AiNaturalLanguageQueryResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleQuery = async (queryText?: string) => {
    const textToQuery = (queryText ?? prompt).trim();
    if (!textToQuery) return;

    if (queryText) {
      setPrompt(queryText);
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetchAiNaturalLanguageReportQuery(
        textToQuery,
        currentFilters,
      );
      setResult(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to process AI query.";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApplyFilters(result.appliedFilters);
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 4000);
  };

  const handleClear = () => {
    setPrompt("");
    setResult(null);
    setError(null);
  };

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
                Agent 7: AI Sales Insights & Conversational Analytics
              </h3>
              <Badge tone="primary" className="text-xs">
                Claude 4.5 Sonnet
              </Badge>
              {result && (
                <Badge tone="success" className="text-xs">
                  {Math.round(result.confidenceScore * 100)}% Confidence
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ask natural language queries to uncover margin leakage, rep
              performance, and pipeline velocity.
            </p>
          </div>
        </div>

        {result && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset Query
          </Button>
        )}
      </div>

      {/* Natural Language Query Bar */}
      <div className="mt-4 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Show me hardware orders with margin compression in Q3' or 'Compare services margin'..."
              className="pl-9 pr-8 text-xs"
            />
            {prompt && (
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="absolute top-2.5 right-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={isAnalyzing || !prompt.trim()}
            className="h-9 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
          >
            {isAnalyzing ? (
              <Spinner className="size-3.5" />
            ) : (
              <Compass className="size-3.5" />
            )}
            Analyze Data
          </Button>
        </form>

        {/* Quick Query Sample Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-medium text-muted-foreground">
            Suggested Prompts:
          </span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuery(qp)}
              disabled={isAnalyzing}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground/80 transition hover:border-primary/40 hover:bg-muted hover:text-foreground"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Query Results & Executive Narrative */}
      {result && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          {/* Executive Narrative */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground/90">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    Executive Synthesis:{" "}
                  </span>
                  <Badge tone="neutral" className="text-xs">
                    {result.queryIntent}
                  </Badge>
                </div>
                <p className="mt-1 leading-relaxed text-foreground/90">
                  {result.executiveNarrative}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Revenue Analyzed</span>
                <DollarSign className="size-3.5 text-primary" />
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                $
                {(result.metricsSummary.totalRevenueMinor / 100).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                  },
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Blended Margin</span>
                <Percent className="size-3.5 text-emerald-500" />
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                {result.metricsSummary.marginPct.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Discount Erosion</span>
                <TrendingUp className="size-3.5 text-amber-500" />
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                $
                {(
                  result.metricsSummary.discountErosionMinor / 100
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Win Rate Progression</span>
                <CheckCircle2 className="size-3.5 text-purple-500" />
              </div>
              <div className="mt-1 text-base font-bold text-foreground">
                {result.metricsSummary.winRatePct}%
              </div>
            </div>
          </div>

          {/* Takeaways & Strategic Actions */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Key Analytical Takeaways
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/85">
                {result.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recommended Strategic Actions
              </h4>
              <ul className="space-y-1.5 text-xs text-foreground/85">
                {result.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Follow-up Questions */}
          {result.suggestedQuestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Suggested Follow-up Inquiries:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuery(q)}
                    disabled={isAnalyzing}
                    className="rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
                  >
                    &ldquo;{q}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>
                Translated Whitelisted Filters:{" "}
                <strong className="text-foreground">
                  {result.appliedFilters.category
                    ? `Category: ${result.appliedFilters.category}`
                    : "All Categories"}
                  {result.appliedFilters.status
                    ? ` • Status: ${result.appliedFilters.status}`
                    : ""}
                  {result.appliedFilters.repId ? " • Scoped to User" : ""}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {appliedSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  Live Report Filters Updated!
                </span>
              )}
              <Button
                size="sm"
                variant="primary"
                onClick={handleApply}
                className="h-8 gap-1.5 rounded-xl text-xs font-semibold shadow-xs"
              >
                <Filter className="size-3.5" />
                Apply Filter to Live Dataset
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
