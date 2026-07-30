import { useEffect, useMemo, useState } from "react";

/**
 * Page-slices an already-filtered array. Page resets to 1 whenever the total
 * item count changes (a new filter/search narrows or widens the set) or the
 * page size changes, so the visitor never lands on a page number that no
 * longer exists.
 */
export function usePagination<T>(items: T[], initialPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [total, pageSize]);

  const clampedPage = Math.min(page, pageCount);
  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  return {
    page: clampedPage,
    pageSize,
    setPage,
    setPageSize,
    pageCount,
    pageItems,
    total,
    startIndex,
    endIndex,
  };
}
