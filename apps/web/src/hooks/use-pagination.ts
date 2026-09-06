import { useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first item shown on the current page (0 when empty). */
  from: number;
  /** 1-based index of the last item shown on the current page. */
  to: number;
  pageItems: T[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canPrev: boolean;
  canNext: boolean;
}

/**
 * Client-side pagination over an already-filtered/sorted array.
 *
 * The list endpoints return full arrays, so slicing happens here. Filtering,
 * search and sort must run BEFORE the array is passed in, so this always
 * paginates the final result set. When the source array changes (e.g. a new
 * filter narrows results), the current page is clamped back into range.
 */
export function usePagination<T>(
  items: T[],
  initialPageSize: number = DEFAULT_PAGE_SIZE,
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Clamp during render: when the result set shrinks below the current page
  // (e.g. a filter narrows results), derive a safe page instead of storing an
  // out-of-range value. Everything below uses safePage, never the raw state.
  const safePage = Math.min(page, pageCount);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return {
    page: safePage,
    pageSize,
    pageCount,
    total,
    from,
    to,
    pageItems,
    setPage,
    setPageSize,
    nextPage: () => setPage((p) => Math.min(p + 1, pageCount)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    canPrev: safePage > 1,
    canNext: safePage < pageCount,
  };
}
