import { Link } from "react-router";
import { FileSpreadsheet, Plus, ExternalLink, ShieldAlert, CheckCircle2 } from "lucide-react";
import { appRoutes } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentQuotations } from "../hooks/use-dashboard-data";
import type { QuotationSummaryItem } from "../api/dashboard-api";

export function RecentQuotesTable() {
  const { data: quotes, isLoading } = useRecentQuotations(6);

  const getStatusBadge = (status: QuotationSummaryItem["status"]) => {
    switch (status) {
      case "DRAFT":
        return <Badge tone="neutral">Draft</Badge>;
      case "PENDING_APPROVAL":
        return <Badge tone="warning">Pending Approval</Badge>;
      case "APPROVED":
        return <Badge tone="primary">Approved</Badge>;
      case "SENT":
        return <Badge tone="primary">Sent</Badge>;
      case "UNDER_NEGOTIATION":
        return <Badge tone="secondary">Under Negotiation</Badge>;
      case "CONFIRMED":
        return <Badge tone="success">Confirmed</Badge>;
      case "REJECTED":
        return <Badge tone="danger">Rejected</Badge>;
      default:
        return <Badge tone="neutral">{status}</Badge>;
    }
  };

  const getRiskScoreBadge = (score: number) => {
    if (score === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary">
          <CheckCircle2 className="size-3.5" />
          Auto (0%)
        </span>
      );
    }
    if (score <= 4) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
          <ShieldAlert className="size-3.5" />
          Manager ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
        <ShieldAlert className="size-3.5" />
        Finance ({score}%)
      </span>
    );
  };

  return (
    <div className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
        <div>
          <h2 className="text-sm font-bold text-foreground sm:text-base">
            Recent Quotations &amp; Proposals
          </h2>
          <p className="text-xs text-muted-foreground">
            Live stream of active deals with blended-risk scoring
          </p>
        </div>
        <Link to={appRoutes.quotations}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <span>View All</span>
            <ExternalLink className="size-3.5" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-surface-muted/40 p-3"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : !quotes || quotes.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Quotations Found"
          description="Your sales team hasn't created any quotations yet. Launch your first quote with live pricing & margin governance."
          action={
            <Link to={appRoutes.quotations}>
              <Button size="sm" className="gap-2 font-semibold">
                <Plus className="size-4" />
                Create First Quotation
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2.5 font-semibold">Code</th>
                <th className="pb-2.5 font-semibold">Customer &amp; Tier</th>
                <th className="pb-2.5 font-semibold">Net Value</th>
                <th className="pb-2.5 font-semibold">Margin %</th>
                <th className="pb-2.5 font-semibold">Risk Engine</th>
                <th className="pb-2.5 font-semibold">Status</th>
                <th className="pb-2.5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {quotes.map((q) => (
                <tr
                  key={q.id}
                  className="transition-colors hover:bg-surface-muted/40"
                >
                  <td className="py-3 font-mono font-bold text-foreground">
                    {q.code}
                  </td>
                  <td className="py-3">
                    <div className="font-semibold text-foreground">
                      {q.customerName}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Tier: {q.customerTier}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-foreground">
                    ${(q.netTotalMinor / 100).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3">
                    <span
                      className={`font-semibold ${
                        q.marginPct >= 30 ? "text-secondary" : "text-warning"
                      }`}
                    >
                      {q.marginPct}%
                    </span>
                  </td>
                  <td className="py-3">
                    {getRiskScoreBadge(q.blendedRiskScore)}
                  </td>
                  <td className="py-3">{getStatusBadge(q.status)}</td>
                  <td className="py-3 text-right">
                    <Link to={`${appRoutes.quotations}/${q.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Open
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentQuotesTable;
