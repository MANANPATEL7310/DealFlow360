import { useState } from "react";
import { Link } from "react-router";
import { appRoutes } from "@template/shared";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApprovalQueueItem } from "@/features/approvals/api/approvals-api";

interface ApprovalsInboxTableProps {
  items: ApprovalQueueItem[];
  isLoading?: boolean;
}

type TabFilter = "ALL" | "ACTIONABLE" | "HIGH_RISK";

function getTierBadge(tier?: string) {
  switch (tier?.toUpperCase()) {
    case "GOLD":
      return <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-500">Gold</Badge>;
    case "SILVER":
      return <Badge tone="secondary">Silver</Badge>;
    case "BRONZE":
      return <Badge tone="neutral">Bronze</Badge>;
    default:
      return <Badge tone="neutral">Standard</Badge>;
  }
}

function getMarginBadge(marginPct: number) {
  if (marginPct < 20) {
    return (
      <Badge tone="danger" className="font-semibold">
        {marginPct.toFixed(1)}%
      </Badge>
    );
  }
  if (marginPct < 30) {
    return (
      <Badge tone="warning" className="font-semibold">
        {marginPct.toFixed(1)}%
      </Badge>
    );
  }
  return (
    <Badge tone="success" className="font-semibold">
      {marginPct.toFixed(1)}%
    </Badge>
  );
}

function getRiskBadge(score?: number) {
  const s = score ?? 0;
  if (s >= 70) {
    return (
      <Badge tone="danger" className="gap-1 font-semibold">
        <AlertCircle className="size-3" />
        High ({s})
      </Badge>
    );
  }
  if (s >= 40) {
    return (
      <Badge tone="warning" className="gap-1 font-semibold">
        <Clock className="size-3" />
        Medium ({s})
      </Badge>
    );
  }
  return (
    <Badge tone="success" className="gap-1 font-semibold">
      <CheckCircle2 className="size-3" />
      Low ({s})
    </Badge>
  );
}

export function ApprovalsInboxTable({
  items,
  isLoading,
}: ApprovalsInboxTableProps) {
  const [filter, setFilter] = useState<TabFilter>("ALL");
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) => {
    if (filter === "ACTIONABLE" && !item.canReview) return false;
    if (filter === "HIGH_RISK" && (item.quotation.blendedRiskScore ?? 0) < 70)
      return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const quoteNum = item.quotation.quotationNumber.toLowerCase();
      const custName = (item.quotation.customer?.name ?? "").toLowerCase();
      return quoteNum.includes(q) || custName.includes(q);
    }
    return true;
  });

  const actionableCount = items.filter((i) => i.canReview).length;
  const highRiskCount = items.filter(
    (i) => (i.quotation.blendedRiskScore ?? 0) >= 70,
  ).length;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface-muted/40 p-1">
          <Button
            size="sm"
            variant={filter === "ALL" ? "primary" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("ALL")}
          >
            All Pending ({items.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "ACTIONABLE" ? "primary" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("ACTIONABLE")}
          >
            Actionable ({actionableCount})
          </Button>
          <Button
            size="sm"
            variant={filter === "HIGH_RISK" ? "primary" : "ghost"}
            className="h-8 rounded-lg text-xs"
            onClick={() => setFilter("HIGH_RISK")}
          >
            High Risk ({highRiskCount})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quote # or customer..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card overflow-hidden rounded-2xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-surface-muted/50">
              <TableHead className="text-xs font-semibold">Quotation</TableHead>
              <TableHead className="text-xs font-semibold">Customer</TableHead>
              <TableHead className="text-right text-xs font-semibold">Grand Total</TableHead>
              <TableHead className="text-center text-xs font-semibold">Margin</TableHead>
              <TableHead className="text-center text-xs font-semibold">Risk Profile</TableHead>
              <TableHead className="text-xs font-semibold">Pending Review Level</TableHead>
              <TableHead className="text-center text-xs font-semibold">Status</TableHead>
              <TableHead className="text-right text-xs font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skeleton-row-${i}`}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12">
                  <EmptyState
                    icon={ShieldAlert}
                    title="No quotations requiring review"
                    description={
                      filter !== "ALL" || search
                        ? "No pending quotations match your current search or filter."
                        : "Your approval queue is clear. All deals have been processed or are waiting in prior review tiers."
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const q = item.quotation;
                const totalDollars = (q.grandTotalMinor / 100).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                );
                const createdFormatted = q.createdAt
                  ? new Date(q.createdAt).toLocaleDateString()
                  : "Recent";

                return (
                  <TableRow
                    key={q.id}
                    className="border-border transition-colors hover:bg-surface-muted/40"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {q.quotationNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {createdFormatted}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {q.customer?.name ?? "Unnamed Customer"}
                        </span>
                        {getTierBadge(q.customer?.tier)}
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-semibold text-foreground">
                      ${totalDollars}
                    </TableCell>

                    <TableCell className="text-center">
                      {getMarginBadge(q.marginPct)}
                    </TableCell>

                    <TableCell className="text-center">
                      {getRiskBadge(q.blendedRiskScore)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-warning" />
                        <span className="text-xs font-medium text-foreground">
                          {item.requiredRoleLabel}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      {item.canReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-primary" />
                          </span>
                          Ready to Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          Other Tier
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Link to={appRoutes.approvalDetail(q.id)}>
                        <Button
                          size="sm"
                          variant={item.canReview ? "primary" : "outline"}
                          className="h-8 gap-1 rounded-lg text-xs"
                        >
                          Review
                          <ArrowRight className="size-3" />
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
