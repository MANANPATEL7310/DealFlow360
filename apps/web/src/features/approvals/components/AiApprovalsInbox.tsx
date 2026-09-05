import { useState } from "react";
import { Inbox, Filter, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useApprovals } from "../api/use-approvals";
import { ApprovalCard } from "./ApprovalCard";

export function AiApprovalsInbox() {
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [kindFilter, setKindFilter] = useState<string>("ALL");

  const {
    data: approvals,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useApprovals(statusFilter === "ALL" ? undefined : statusFilter);

  const filteredItems = (approvals ?? []).filter((item) => {
    if (kindFilter !== "ALL" && item.kind !== kindFilter) return false;
    return true;
  });

  const pendingCount = (approvals ?? []).filter(
    (a) => a.status === "PENDING",
  ).length;

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-surface-muted/40 p-1">
          {(["PENDING", "ALL", "APPROVED", "REJECTED"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? "bg-primary text-surface shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {status === "PENDING"
                  ? `Pending (${pendingCount})`
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ),
          )}
        </div>

        {/* Kind Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="DISCOUNT">Discounts (Agent 1)</option>
              <option value="NEGOTIATION">Negotiation Drafts (Agent 6)</option>
              <option value="FULFILLMENT_OVERRIDE">
                Fulfillment Overrides
              </option>
              <option value="CREDIT_NOTE">Credit Notes</option>
              <option value="NUDGE">Deal Nudges</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="text-xs"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Spinner className="size-6 text-primary" />
          <p className="text-sm font-medium">Loading approval queue...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
          <ShieldAlert className="size-8 text-danger" />
          <p className="text-sm font-medium text-danger">
            Failed to load approvals queue.
          </p>
          <Button size="sm" variant="outline" onClick={() => void refetch()}>
            Try Again
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-surface/40 p-12 text-center backdrop-blur-sm">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Inbox className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Inbox is Clear
            </h3>
            <p className="max-w-sm text-xs text-muted-foreground">
              No approval requests match the current filters. Agent proposals
              requiring human intervention will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <ApprovalCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
