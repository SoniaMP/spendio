import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSummaryConfig } from '@/hooks/useSummaryConfig';

describe('useSummaryConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty selections', () => {
    const { result } = renderHook(() => useSummaryConfig());
    expect(result.current.config.selectedSheetIds).toEqual([]);
    expect(result.current.config.selectedCategoryIds).toEqual([]);
  });

  it('toggles a sheet on and off', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.toggleSheet(1));
    expect(result.current.config.selectedSheetIds).toEqual([1]);

    act(() => result.current.toggleSheet(1));
    expect(result.current.config.selectedSheetIds).toEqual([]);
  });

  it('toggles a category on and off', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.toggleCategory(5));
    expect(result.current.config.selectedCategoryIds).toEqual([5]);

    act(() => result.current.toggleCategory(5));
    expect(result.current.config.selectedCategoryIds).toEqual([]);
  });

  it('selects all sheets and clears them', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.selectAllSheets([1, 2, 3]));
    expect(result.current.config.selectedSheetIds).toEqual([1, 2, 3]);

    act(() => result.current.clearSheets());
    expect(result.current.config.selectedSheetIds).toEqual([]);
  });

  it('persists config to localStorage', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.toggleSheet(7));

    const stored = JSON.parse(localStorage.getItem('spendio-summary-config')!);
    expect(stored.selectedSheetIds).toEqual([7]);
  });
});
