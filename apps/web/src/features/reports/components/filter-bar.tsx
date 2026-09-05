import { Calendar, Filter, RotateCcw, User, Layers, Tag } from "lucide-react";
import type { ReportFilters } from "@template/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FilterBarProps {
  value: ReportFilters;
  onChange: (patch: ReportFilters) => void;
  canPickRep: boolean;
  reps?: { id: string; name: string }[];
}

const LIFECYCLE_STATUSES = [
  { value: "", label: "All Lifecycle Stages" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "SENT", label: "Sent to Client" },
  { value: "UNDER_NEGOTIATION", label: "Under Negotiation" },
  { value: "CONFIRMED", label: "Confirmed Deal" },
  { value: "FULFILLMENT", label: "In Fulfillment" },
  { value: "BILLING", label: "In Billing" },
  { value: "PAID", label: "Fully Paid" },
  { value: "REJECTED", label: "Rejected" },
];

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "SERVICES", label: "Services" },
  { value: "SUBSCRIPTIONS", label: "Subscriptions" },
];

const DEFAULT_REPS = [
  { id: "usr-sales-01", name: "Alex Miller (Senior Rep)" },
  { id: "usr-sales-02", name: "Elena Rostova (Enterprise Rep)" },
  { id: "usr-mgr-01", name: "Sarah Chen (Commercial Mgr)" },
  { id: "usr-fin-01", name: "Marcus Vance (Finance)" },
];

export function FilterBar({
  value,
  onChange,
  canPickRep,
  reps = DEFAULT_REPS,
}: FilterBarProps) {
  const setFilter = (patch: Partial<ReportFilters>) => {
    onChange({
      ...value,
      ...patch,
    });
  };

  const handlePreset = (preset: "30d" | "qtd" | "ytd" | "all") => {
    const now = new Date();
    if (preset === "all") {
      setFilter({ from: undefined, to: undefined });
      return;
    }

    if (preset === "30d") {
      const from = new Date();
      from.setDate(now.getDate() - 30);
      setFilter({ from, to: now });
      return;
    }

    if (preset === "qtd") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), currentQuarter * 3, 1);
      setFilter({ from, to: now });
      return;
    }

    if (preset === "ytd") {
      const from = new Date(now.getFullYear(), 0, 1);
      setFilter({ from, to: now });
      return;
    }
  };

  const formatDateValue = (d?: Date | string) => {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  };

  return (
    <div className="surface-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Multi-Dimensional Filters
          </span>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground mr-1 hidden sm:inline">
            Range presets:
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("30d")}
            className="h-7 px-2 text-xs"
          >
            Last 30D
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("qtd")}
            className="h-7 px-2 text-xs"
          >
            QTD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("ytd")}
            className="h-7 px-2 text-xs"
          >
            YTD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreset("all")}
            className="h-7 px-2 text-xs"
          >
            All Time
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 items-end">
        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" /> From Date
          </label>
          <Input
            type="date"
            value={formatDateValue(value.from)}
            onChange={(e) =>
              setFilter({
                from: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="h-9 text-xs"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" /> To Date
          </label>
          <Input
            type="date"
            value={formatDateValue(value.to)}
            onChange={(e) =>
              setFilter({
                to: e.target.value ? new Date(e.target.value) : undefined,
              })
            }
            className="h-9 text-xs"
          />
        </div>

        {/* Rep Selector (Governance aware) */}
        {canPickRep && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User className="size-3.5" /> Sales Representative
            </label>
            <select
              value={value.repId ?? ""}
              onChange={(e) =>
                setFilter({ repId: e.target.value || undefined })
              }
              aria-label="Sales Representative"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Sales Representatives</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lifecycle Status Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Layers className="size-3.5" /> Lifecycle Stage
          </label>
          <select
            value={value.status ?? ""}
            onChange={(e) => setFilter({ status: e.target.value || undefined })}
            aria-label="Lifecycle Stage"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {LIFECYCLE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Product Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Tag className="size-3.5" /> Product Category
          </label>
          <select
            value={value.category ?? ""}
            onChange={(e) =>
              setFilter({ category: e.target.value || undefined })
            }
            aria-label="Product Category"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter summary & Clear button */}
      {(value.from ||
        value.to ||
        value.repId ||
        value.status ||
        value.category) && (
        <div className="flex items-center justify-between pt-2 text-xs border-t border-border/40">
          <span className="text-muted-foreground">
            Filters currently restricting aggregation dataset.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({})}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3 mr-1.5" /> Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}
