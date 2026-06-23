import { describe, it, expect } from 'vitest';
import {
  getMonthKey,
  getMonthLabel,
  getCurrentMonth,
  getPreviousMonth,
  getDateRangeForPreset,
  formatDateRangeLabel,
  DatePreset,
} from '@/helpers/dateHelpers';

describe('getMonthKey', () => {
  it('pads single-digit month', () => {
    expect(getMonthKey(2026, 3)).toBe('2026-03');
  });

  it('keeps double-digit month', () => {
    expect(getMonthKey(2026, 12)).toBe('2026-12');
  });
});

describe('getMonthLabel', () => {
  it('returns Spanish month + year', () => {
    expect(getMonthLabel(2026, 3)).toBe('marzo 2026');
  });

  it('handles December', () => {
    expect(getMonthLabel(2025, 12)).toBe('diciembre 2025');
  });
});

describe('getPreviousMonth', () => {
  it('returns the previous month in the same year', () => {
    expect(getPreviousMonth(2026, 3)).toEqual({ year: 2026, month: 2 });
  });

  it('wraps January to December of the previous year', () => {
    expect(getPreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
  });

  it('handles February', () => {
    expect(getPreviousMonth(2026, 2)).toEqual({ year: 2026, month: 1 });
  });

  it('handles December', () => {
    expect(getPreviousMonth(2026, 12)).toEqual({ year: 2026, month: 11 });
  });
});

describe('getCurrentMonth', () => {
  it('returns an object with year and month', () => {
    const result = getCurrentMonth();
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
  });
});

describe('getDateRangeForPreset', () => {
  const today = new Date(2026, 5, 18); // 2026-06-18

  it('returns the current month for ThisMonth', () => {
    expect(getDateRangeForPreset(DatePreset.ThisMonth, today)).toEqual({
      from: '2026-06-01',
      to: '2026-06-30',
    });
  });

  it('returns the last 3 months for Last3Months', () => {
    expect(getDateRangeForPreset(DatePreset.Last3Months, today)).toEqual({
      from: '2026-04-01',
      to: '2026-06-30',
    });
  });

  it('handles year boundary in Last3Months', () => {
    const january = new Date(2026, 0, 15); // 2026-01-15
    expect(getDateRangeForPreset(DatePreset.Last3Months, january)).toEqual({
      from: '2025-11-01',
      to: '2026-01-31',
    });
  });

  it('returns Jan 1 to Dec 31 for ThisYear', () => {
    expect(getDateRangeForPreset(DatePreset.ThisYear, today)).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
});

describe('formatDateRangeLabel', () => {
  it('formats a range with both endpoints', () => {
    expect(formatDateRangeLabel('2026-03-01', '2026-06-18')).toMatch(/mar.*–.*jun/);
  });
});
