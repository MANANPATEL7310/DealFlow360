import { useState } from "react";
import { Link } from "react-router";
import { ExternalLink, Search, ShieldCheck } from "lucide-react";
import {
  appRoutes,
  type DealHealthScore,
  type HealthCategory,
} from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DealHealthTableProps {
  scores: DealHealthScore[];
  selectedCategory: HealthCategory | "ALL";
}

export function DealHealthTable({
  scores,
  selectedCategory,
}: DealHealthTableProps) {
  const [search, setSearch] = useState("");

  const filtered = scores.filter((item) => {
    if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesCode = item.quotationCode.toLowerCase().includes(q);
      const matchesName = item.customerName.toLowerCase().includes(q);
      const matchesRep = item.salesRepName.toLowerCase().includes(q);
      if (!matchesCode && !matchesName && !matchesRep) return false;
    }
    return true;
  });

  const getScoreBadge = (score: number, category: HealthCategory) => {
    switch (category) {
      case "HEALTHY":
        return (
          <Badge tone="success" className="font-mono font-bold text-xs">
            {score}/100 Healthy
          </Badge>
        );
      case "WATCH":
        return (
          <Badge tone="primary" className="font-mono font-bold text-xs">
            {score}/100 Watch
          </Badge>
        );
      case "AT_RISK":
        return (
          <Badge tone="warning" className="font-mono font-bold text-xs">
            {score}/100 At Risk
          </Badge>
        );
      case "CRITICAL":
      default:
        return (
          <Badge tone="danger" className="font-mono font-bold text-xs">
            {score}/100 Critical
          </Badge>
        );
    }
  };

  return (
    <div className="surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Monitored Opportunity Directory
          </h3>
          <p className="text-xs text-muted-foreground">
            Holistic deal telemetry and composite health scores across all
            active quotations.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quote or account..."
            className="h-9 w-full pr-3 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-muted/60">
              <TableHead className="min-w-44">Quotation & Account</TableHead>
              <TableHead className="text-center">Deal Health</TableHead>
              <TableHead className="text-center">Pipeline Stage</TableHead>
              <TableHead className="text-right">Net Value</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-center">Inactivity</TableHead>
              <TableHead>Active Flags</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No quotations found matching your search or category filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((deal) => {
                const formattedValue = (
                  deal.netTotalMinor / 100
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                return (
                  <TableRow
                    key={deal.quotationId}
                    className="hover:bg-surface-muted/30 transition-colors"
                  >
                    {/* Quotation & Account */}
                    <TableCell className="align-middle py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {deal.quotationCode}
                          </span>
                          <Badge tone="secondary" className="text-xs">
                            {deal.customerTier}
                          </Badge>
                        </div>
                        <div className="text-xs text-foreground font-medium">
                          {deal.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rep: {deal.salesRepName}
                        </div>
                      </div>
                    </TableCell>

                    {/* Deal Health Score */}
                    <TableCell className="align-middle py-3.5 text-center">
                      {getScoreBadge(deal.score, deal.category)}
                    </TableCell>

                    {/* Stage */}
                    <TableCell className="align-middle py-3.5 text-center">
                      <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-foreground border border-border">
                        {deal.stage.replace("_", " ")}
                      </span>
                    </TableCell>

                    {/* Net Value */}
                    <TableCell className="align-middle py-3.5 text-right font-mono text-xs font-bold text-foreground">
                      ${formattedValue}
                    </TableCell>

                    {/* Margin */}
                    <TableCell className="align-middle py-3.5 text-right font-mono text-xs">
                      <span
                        className={
                          deal.marginPct >= 35
                            ? "text-emerald-600 dark:text-emerald-400 font-bold"
                            : deal.marginPct >= 20
                              ? "text-warning font-semibold"
                              : "text-danger font-bold"
                        }
                      >
                        {deal.marginPct.toFixed(1)}%
                      </span>
                    </TableCell>

                    {/* Inactivity */}
                    <TableCell className="align-middle py-3.5 text-center text-xs">
                      {deal.daysInStage >= 14 ? (
                        <span className="font-mono text-danger font-bold">
                          {deal.daysInStage}d stalled
                        </span>
                      ) : (
                        <span className="font-mono text-muted-foreground">
                          {deal.daysInStage}d ago
                        </span>
                      )}
                    </TableCell>

                    {/* Active Flags */}
                    <TableCell className="align-middle py-3.5">
                      {deal.activeAnomalies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {deal.activeAnomalies.map((anom) => (
                            <span
                              key={anom}
                              className="rounded-md bg-danger/10 px-1.5 py-0.5 text-xs font-medium text-danger border border-danger/20"
                            >
                              {anom.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ShieldCheck className="size-3.5 text-emerald-500" />
                          Optimal
                        </span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="align-middle py-3.5 text-right">
                      <Link to={appRoutes.quotationBuilder(deal.quotationId)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          title="Open Quotation Builder"
                        >
                          <span>Open</span>
                          <ExternalLink className="size-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
