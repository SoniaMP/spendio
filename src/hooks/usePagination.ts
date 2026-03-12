import { useState, useMemo } from 'react';

const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number] | 'all';

interface UsePaginationOptions {
  totalItems: number;
  initialPageSize?: PageSizeOption;
}

interface UsePaginationResult {
  currentPage: number;
  totalPages: number;
  pageSize: PageSizeOption;
  pageSizeOptions: readonly [...typeof PAGE_SIZE_OPTIONS, 'all'];
  startIndex: number;
  endIndex: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canGoFirst: boolean;
  canGoLast: boolean;
  goToPage: (page: number) => void;
  goFirst: () => void;
  goLast: () => void;
  goNext: () => void;
  goPrevious: () => void;
  changePageSize: (size: PageSizeOption) => void;
}

export function usePagination({
  totalItems,
  initialPageSize = 10,
}: UsePaginationOptions): UsePaginationResult {
  const [pageState, setPageState] = useState({
    currentPage: 1,
    pageSize: initialPageSize as PageSizeOption,
    prevTotalItems: totalItems,
  });

  let { currentPage } = pageState;
  const { pageSize } = pageState;

  if (pageState.prevTotalItems !== totalItems) {
    currentPage = 1;
    setPageState((prev) => ({
      ...prev,
      currentPage: 1,
      prevTotalItems: totalItems,
    }));
  }

  const isShowAll = pageSize === 'all';
  const effectivePageSize = isShowAll ? totalItems || 1 : pageSize;
  const totalPages = isShowAll
    ? 1
    : Math.max(1, Math.ceil(totalItems / effectivePageSize));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * effectivePageSize;
  const endIndex = Math.min(startIndex + effectivePageSize, totalItems);

  const canGoPrevious = safePage > 1;
  const canGoNext = safePage < totalPages;
  const canGoFirst = canGoPrevious;
  const canGoLast = canGoNext;

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, totalPages));
    setPageState((prev) => ({
      ...prev,
      currentPage: clamped,
      prevTotalItems: totalItems,
    }));
  }

  const pageSizeOptions = [...PAGE_SIZE_OPTIONS, 'all'] as const;

  const result = useMemo(
    () => ({
      currentPage: safePage,
      totalPages,
      pageSize,
      pageSizeOptions,
      startIndex,
      endIndex,
      canGoPrevious,
      canGoNext,
      canGoFirst,
      canGoLast,
      goToPage,
      goFirst: () => goToPage(1),
      goLast: () => goToPage(totalPages),
      goNext: () => {
        if (canGoNext) goToPage(safePage + 1);
      },
      goPrevious: () => {
        if (canGoPrevious) goToPage(safePage - 1);
      },
      changePageSize: (size: PageSizeOption) => {
        setPageState({
          currentPage: 1,
          pageSize: size,
          prevTotalItems: totalItems,
        });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [safePage, totalPages, pageSize, startIndex, endIndex, canGoPrevious, canGoNext],
  );

  return result;
}
