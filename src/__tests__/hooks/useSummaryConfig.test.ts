import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSummaryConfig } from '@/hooks/useSummaryConfig';
import { DatePreset } from '@/helpers/dateHelpers';

describe('useSummaryConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with empty selections', () => {
    const { result } = renderHook(() => useSummaryConfig());
    expect(result.current.config.selectedSheetIds).toEqual([]);
    expect(result.current.config.selectedCategoryIds).toBeNull();
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

  it('defaults the date preset to ThisMonth', () => {
    const { result } = renderHook(() => useSummaryConfig());
    expect(result.current.config.datePreset).toBe(DatePreset.ThisMonth);
  });

  it('derives a date range for the active preset', () => {
    const { result } = renderHook(() => useSummaryConfig());
    expect(result.current.dateRange.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.dateRange.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.dateRange.from <= result.current.dateRange.to).toBe(true);
  });

  it('changes the date preset', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.setDatePreset(DatePreset.ThisYear));
    expect(result.current.config.datePreset).toBe(DatePreset.ThisYear);
  });

  it('sets a custom range and switches to the custom preset', () => {
    const { result } = renderHook(() => useSummaryConfig());

    act(() => result.current.setCustomRange('2026-01-01', '2026-03-31'));

    expect(result.current.config.datePreset).toBe(DatePreset.Custom);
    expect(result.current.dateRange).toEqual({ from: '2026-01-01', to: '2026-03-31' });
  });

  it('migrates an old config without the date fields', () => {
    localStorage.setItem(
      'spendio-summary-config',
      JSON.stringify({ selectedSheetIds: [3], selectedCategoryIds: [9] }),
    );

    const { result } = renderHook(() => useSummaryConfig());

    expect(result.current.config.selectedSheetIds).toEqual([3]);
    expect(result.current.config.datePreset).toBe(DatePreset.ThisMonth);
    expect(result.current.config.customFrom).toBeNull();
  });
});
