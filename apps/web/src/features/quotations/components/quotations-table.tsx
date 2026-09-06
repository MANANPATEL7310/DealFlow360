import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Quotation, QuotationStatus } from "@template/shared";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/hooks/use-pagination";

interface QuotationsTableProps {
  quotations: Quotation[];
  isLoading?: boolean;
}

const STATUS_FILTERS: Array<{ label: string; value: QuotationStatus | "ALL" }> =
  [
    { label: "All Quotes", value: "ALL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Pending Approval", value: "PENDING_APPROVAL" },
    { label: "Approved", value: "APPROVED" },
    { label: "Confirmed", value: "CONFIRMED" },
  ];

function getStatusBadge(status: QuotationStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge tone="neutral">Draft</Badge>;
    case "PENDING_APPROVAL":
      return (
        <Badge className="border-warning/30 bg-warning-light/20 text-warning-dark">
          <Clock className="mr-1 size-3" /> Pending Review
        </Badge>
      );
    case "APPROVED":
      return (
        <Badge tone="success">
          <CheckCircle2 className="mr-1 size-3" /> Approved
        </Badge>
      );
    case "SENT":
      return <Badge tone="primary">Sent</Badge>;
    case "UNDER_NEGOTIATION":
      return <Badge tone="warning">Negotiating</Badge>;
    case "CONFIRMED":
      return (
        <Badge tone="primary">
          <CheckCircle2 className="mr-1 size-3" /> Confirmed
        </Badge>
      );
    case "FULFILLMENT":
      return <Badge tone="secondary">Fulfillment</Badge>;
    case "BILLING":
      return <Badge tone="secondary">Billing</Badge>;
    case "PAID":
      return <Badge tone="success">Paid</Badge>;
    case "REJECTED":
      return <Badge tone="danger">Rejected</Badge>;
  }
}

export function QuotationsTable({
  quotations,
  isLoading,
}: QuotationsTableProps) {
  const [activeStatus, setActiveStatus] = useState<QuotationStatus | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");

  const filtered = quotations.filter((q) => {
    if (activeStatus !== "ALL" && q.status !== activeStatus) return false;
    if (search.trim().length > 0) {
      const query = search.toLowerCase().trim();
      const matchesNum = q.quotationNumber.toLowerCase().includes(query);
      const matchesCust =
        q.customer?.name.toLowerCase().includes(query) ?? false;
      return matchesNum || matchesCust;
    }
    return true;
  });

  const pagination = usePagination(filtered);
  const { setPage } = pagination;

  // Reset to the first page whenever the active filter or search narrows the set.
  useEffect(() => {
    setPage(1);
  }, [activeStatus, search, setPage]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeStatus === tab.value
                  ? "bg-primary text-surface shadow-xs"
                  : "bg-surface-muted/50 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              }`}
              type="button"
              onClick={() => setActiveStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            className="h-9 w-full pr-3 pl-9 text-xs"
            placeholder="Search quote # or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quotation #</TableHead>
              <TableHead>Customer Account</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Grand Total</TableHead>
              <TableHead>Gross Margin</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((quote) => {
              const customerTier = quote.customer?.tier ?? "BRONZE";
              const tierBadgeTone =
                customerTier === "GOLD"
                  ? "primary"
                  : customerTier === "SILVER"
                    ? "secondary"
                    : "warning";

              const formattedTotal = (
                quote.grandTotalMinor / 100
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              // List responses omit the nested `lines` array and carry an
              // aggregate `_count.lines` instead.
              const lineCount = quote.lines?.length ?? quote._count?.lines ?? 0;

              return (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-md bg-surface-muted text-foreground">
                        <FileText className="size-3.5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {quote.quotationNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quote.createdAt
                            ? new Date(quote.createdAt).toLocaleDateString()
                            : "Draft"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {quote.customer?.name ?? "Enterprise Client"}
                      </div>
                      <Badge className="mt-0.5 text-xs" tone={tierBadgeTone}>
                        {customerTier} Tier
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-foreground">
                      {lineCount} {lineCount === 1 ? "line" : "lines"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-foreground">
                      ${formattedTotal}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        quote.marginPct >= 35
                          ? "text-success-dark"
                          : quote.marginPct >= 20
                            ? "text-warning-dark"
                            : "text-danger-dark"
                      }`}
                    >
                      {quote.marginPct.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {quote.blendedRiskScore === 0 ? (
                      <Badge tone="success">0.00 Risk</Badge>
                    ) : (
                      <Badge className="border-danger/30 bg-danger-light/20 text-danger-dark">
                        <ShieldAlert className="mr-1 size-3" />
                        {quote.blendedRiskScore.toFixed(2)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(quote.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/app/quotations/${quote.id}`}>
                      <Button
                        className="h-8 px-2.5 text-xs"
                        size="sm"
                        variant="ghost"
                      >
                        Open Builder <ArrowUpRight className="ml-1 size-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          from={pagination.from}
          to={pagination.to}
          canPrev={pagination.canPrev}
          canNext={pagination.canNext}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
          onPageSizeChange={pagination.setPageSize}
          itemLabel="quotation"
        />
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
          <FileSpreadsheet className="mb-2 size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            No quotations match selected filters.
          </p>
          <p className="text-xs text-muted-foreground">
            Clear filter criteria or initialize a new draft quotation.
          </p>
        </div>
      ) : null}
    </div>
  );
}
