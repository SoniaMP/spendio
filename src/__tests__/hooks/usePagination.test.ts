import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination', () => {
  it('initializes to page 1 with default page size of 10', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25 }),
    );

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.pageSize).toBe(10);
  });

  it('computes correct start and end indices', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(10);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goNext());

    expect(result.current.currentPage).toBe(2);
    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(20);
  });

  it('navigates to previous page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(3));
    act(() => result.current.goPrevious());

    expect(result.current.currentPage).toBe(2);
  });

  it('navigates to first page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(3));
    act(() => result.current.goFirst());

    expect(result.current.currentPage).toBe(1);
  });

  it('navigates to last page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goLast());

    expect(result.current.currentPage).toBe(3);
  });

  it('does not go below page 1', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goPrevious());

    expect(result.current.currentPage).toBe(1);
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoFirst).toBe(false);
  });

  it('does not go beyond the last page', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(3));
    act(() => result.current.goNext());

    expect(result.current.currentPage).toBe(3);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoLast).toBe(false);
  });

  it('clamps goToPage to valid range', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(99));
    expect(result.current.currentPage).toBe(3);

    act(() => result.current.goToPage(-5));
    expect(result.current.currentPage).toBe(1);
  });

  it('handles last page with fewer items', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(3));

    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(25);
  });

  it('resets to page 1 when totalItems changes', () => {
    let totalItems = 25;
    const { result, rerender } = renderHook(() =>
      usePagination({ totalItems, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(3));
    expect(result.current.currentPage).toBe(3);

    totalItems = 15;
    rerender();

    expect(result.current.currentPage).toBe(1);
  });

  it('changes page size and resets to page 1', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.goToPage(2));
    act(() => result.current.changePageSize(5));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(5);
    expect(result.current.totalPages).toBe(5);
  });

  it('shows all items when pageSize is "all"', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 25, initialPageSize: 10 }),
    );

    act(() => result.current.changePageSize('all'));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBe(25);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrevious).toBe(false);
  });

  it('returns totalPages of 1 when there are no items', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 0 }),
    );

    expect(result.current.totalPages).toBe(1);
    expect(result.current.canGoNext).toBe(false);
    expect(result.current.canGoPrevious).toBe(false);
  });

  it('exposes pageSizeOptions', () => {
    const { result } = renderHook(() =>
      usePagination({ totalItems: 10 }),
    );

    expect(result.current.pageSizeOptions).toEqual([5, 10, 25, 'all']);
  });
});
