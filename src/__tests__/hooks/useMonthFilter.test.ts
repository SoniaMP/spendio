import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMonthFilter } from '@/hooks/useMonthFilter';

describe('useMonthFilter', () => {
  it('initializes to the current month', () => {
    const now = new Date();
    const { result } = renderHook(() => useMonthFilter());

    expect(result.current.year).toBe(now.getFullYear());
    expect(result.current.month).toBe(now.getMonth() + 1);
  });

  it('provides a monthKey in YYYY-MM format', () => {
    const { result } = renderHook(() => useMonthFilter());

    expect(result.current.monthKey).toMatch(/^\d{4}-\d{2}$/);
  });

  it('provides a Spanish monthLabel', () => {
    const { result } = renderHook(() => useMonthFilter());

    expect(result.current.monthLabel).toBeTruthy();
    expect(typeof result.current.monthLabel).toBe('string');
  });

  it('goes to the previous month', () => {
    const { result } = renderHook(() => useMonthFilter());
    const initialMonth = result.current.month;
    const initialYear = result.current.year;

    act(() => {
      result.current.goToPreviousMonth();
    });

    if (initialMonth === 1) {
      expect(result.current.month).toBe(12);
      expect(result.current.year).toBe(initialYear - 1);
    } else {
      expect(result.current.month).toBe(initialMonth - 1);
      expect(result.current.year).toBe(initialYear);
    }
  });

  it('goes to the next month', () => {
    const { result } = renderHook(() => useMonthFilter());
    const initialMonth = result.current.month;
    const initialYear = result.current.year;

    act(() => {
      result.current.goToNextMonth();
    });

    if (initialMonth === 12) {
      expect(result.current.month).toBe(1);
      expect(result.current.year).toBe(initialYear + 1);
    } else {
      expect(result.current.month).toBe(initialMonth + 1);
      expect(result.current.year).toBe(initialYear);
    }
  });

  it('wraps from January to December of previous year', () => {
    const { result } = renderHook(() => useMonthFilter());

    // Navigate back to January
    const stepsToJanuary = result.current.month - 1;
    act(() => {
      for (let i = 0; i < stepsToJanuary; i++) {
        result.current.goToPreviousMonth();
      }
    });
    expect(result.current.month).toBe(1);

    const yearAtJanuary = result.current.year;

    act(() => {
      result.current.goToPreviousMonth();
    });

    expect(result.current.month).toBe(12);
    expect(result.current.year).toBe(yearAtJanuary - 1);
  });

  it('wraps from December to January of next year', () => {
    const { result } = renderHook(() => useMonthFilter());

    // Navigate forward to December
    const stepsToDecember = 12 - result.current.month;
    act(() => {
      for (let i = 0; i < stepsToDecember; i++) {
        result.current.goToNextMonth();
      }
    });
    expect(result.current.month).toBe(12);

    const yearAtDecember = result.current.year;

    act(() => {
      result.current.goToNextMonth();
    });

    expect(result.current.month).toBe(1);
    expect(result.current.year).toBe(yearAtDecember + 1);
  });

  it('provides previousMonthKey in YYYY-MM format', () => {
    const { result } = renderHook(() => useMonthFilter());

    expect(result.current.previousMonthKey).toMatch(/^\d{4}-\d{2}$/);
  });

  it('provides a Spanish previousMonthLabel', () => {
    const { result } = renderHook(() => useMonthFilter());

    expect(result.current.previousMonthLabel).toBeTruthy();
    expect(typeof result.current.previousMonthLabel).toBe('string');
  });

  it('previousMonthKey wraps January to December of previous year', () => {
    const { result } = renderHook(() => useMonthFilter());

    // Navigate to January
    const stepsToJanuary = result.current.month - 1;
    act(() => {
      for (let i = 0; i < stepsToJanuary; i++) {
        result.current.goToPreviousMonth();
      }
    });
    expect(result.current.month).toBe(1);

    const yearAtJanuary = result.current.year;
    expect(result.current.previousMonthKey).toBe(`${yearAtJanuary - 1}-12`);
  });

  it('updates monthKey and monthLabel when navigating', () => {
    const { result } = renderHook(() => useMonthFilter());

    const initialKey = result.current.monthKey;
    const initialLabel = result.current.monthLabel;

    act(() => {
      result.current.goToPreviousMonth();
    });

    expect(result.current.monthKey).not.toBe(initialKey);
    expect(result.current.monthLabel).not.toBe(initialLabel);
  });
});
