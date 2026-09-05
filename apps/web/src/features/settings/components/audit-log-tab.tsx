import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { AuditLog, AuditLogQuery } from "@template/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuditLogs } from "../hooks/use-admin-settings";

const PAGE_SIZE = 10;

export function AuditLogTab() {
  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading } = useAuditLogs(filters);

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (patch: Partial<AuditLogQuery>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page: 1, // reset to page 1 on filter
    }));
  };

  const formatDateValue = (d?: Date | string) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="surface-card rounded-2xl border border-border p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Audit Log Filters</h4>
          </div>
          {(filters.action || filters.entity || filters.from || filters.to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ page: 1, pageSize: PAGE_SIZE })}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1" /> Reset
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Action Keyword</label>
            <div className="relative">
              <Search className="size-3.5 absolute top-2.5 left-2.5 text-muted-foreground" />
              <Input
                placeholder="e.g. approved, settings..."
                value={filters.action ?? ""}
                onChange={(e) => handleFilterChange({ action: e.target.value || undefined })}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Entity Name</label>
            <Input
              placeholder="e.g. Quotation, SystemSetting..."
              value={filters.entity ?? ""}
              onChange={(e) => handleFilterChange({ entity: e.target.value || undefined })}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">From Date</label>
            <Input
              type="date"
              value={formatDateValue(filters.from)}
              onChange={(e) =>
                handleFilterChange({ from: e.target.value ? new Date(e.target.value) : undefined })
              }
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">To Date</label>
            <Input
              type="date"
              value={formatDateValue(filters.to)}
              onChange={(e) =>
                handleFilterChange({ to: e.target.value ? new Date(e.target.value) : undefined })
              }
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="surface-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Compliance Activity Stream</h3>
            <p className="text-xs text-muted-foreground">
              Immutable SOC2/ISO audit log recording all quotations, approvals, governance, and config events.
            </p>
          </div>
          <Badge tone="neutral" className="text-xs font-mono">
            Total Records: {data?.total ?? 0}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            No audit records found matching active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action Code</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Business Reason</th>
                  <th className="py-3 px-4 text-center">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data?.items.map((log) => {
                  const actorTone: "primary" | "warning" | "secondary" | "neutral" =
                    log.actorKind === "customer"
                      ? "warning"
                      : log.actorKind === "system"
                        ? "secondary"
                        : "primary";

                  return (
                    <tr key={log.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={actorTone} className="text-xs font-semibold uppercase">
                            {log.actorKind}
                          </Badge>
                          <span className="font-medium text-foreground text-xs">
                            {log.actorName ?? log.actorId ?? "System"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs font-mono bg-surface-muted px-2 py-0.5 rounded text-foreground font-semibold">
                          {log.action}
                        </code>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground">{log.entity}</span>{" "}
                        <span className="text-xs text-muted-foreground font-mono">
                          #{log.entityId.slice(0, 10)}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        {log.reason ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.diff ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="h-7 px-2 text-xs gap-1 border-border font-mono"
                          >
                            <Code className="size-3 text-primary" /> View Diff
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-surface-muted/20 text-xs">
            <span className="text-muted-foreground">
              Page <strong className="text-foreground">{data.page}</strong> of{" "}
              <strong className="text-foreground">{data.totalPages}</strong> (
              {data.total} total events)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page <= 1}
                className="h-8 px-2 text-xs"
              >
                <ChevronLeft className="size-3.5 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages}
                className="h-8 px-2 text-xs"
              >
                Next <ChevronRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* State Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="surface-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Audit Diff Inspector: {selectedLog.action}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  <span className="block font-medium text-xs">Entity:</span>
                  <span className="text-foreground font-semibold">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="block font-medium text-xs">Entity ID:</span>
                  <span className="text-foreground font-mono">{selectedLog.entityId}</span>
                </div>
                <div>
                  <span className="block font-medium text-xs">Actor:</span>
                  <span className="text-foreground font-medium">
                    {selectedLog.actorName ?? selectedLog.actorId ?? "System"} ({selectedLog.actorKind})
                  </span>
                </div>
                <div>
                  <span className="block font-medium text-xs">Timestamp:</span>
                  <span className="text-foreground font-mono">
                    {new Date(selectedLog.createdAt).toISOString()}
                  </span>
                </div>
              </div>

              {selectedLog.reason && (
                <div className="rounded-lg bg-surface-muted/50 p-2.5 border border-border/50">
                  <span className="block text-xs font-semibold text-foreground mb-0.5">
                    Logged Business Reason:
                  </span>
                  <p className="text-muted-foreground">{selectedLog.reason}</p>
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-foreground mb-1.5">
                  State Mutation Diff ({'{ before, after }'}):
                </span>
                <pre className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800 max-h-60">
                  {JSON.stringify(selectedLog.diff, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end bg-surface-muted/20">
              <Button size="sm" onClick={() => setSelectedLog(null)} className="h-8 text-xs">
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
