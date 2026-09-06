import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { PAGE_SIZE_OPTIONS } from "@/hooks/use-pagination";

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
  /** Noun describing a single row, e.g. "quotation". */
  itemLabel?: string;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onPageSizeChange,
  itemLabel = "row",
  className,
}: PaginationProps) {
  if (total === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span>
          Showing{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {from}–{to}
          </span>{" "}
          of{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {total}
          </span>{" "}
          {total === 1 ? itemLabel : `${itemLabel}s`}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            className="h-8 rounded-md border border-border bg-surface px-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1.5">
          <span className="tabular-nums">
            Page <span className="font-semibold text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{pageCount}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
              type="button"
              aria-label="Previous page"
              disabled={!canPrev}
              onClick={onPrev}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-40"
              type="button"
              aria-label="Next page"
              disabled={!canNext}
              onClick={onNext}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pagination;
