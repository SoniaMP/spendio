import { describe, it, expect } from 'vitest';
import { getMonthKey, getMonthLabel, getCurrentMonth } from '@/helpers/dateHelpers';

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

describe('getCurrentMonth', () => {
  it('returns an object with year and month', () => {
    const result = getCurrentMonth();
    expect(result).toHaveProperty('year');
    expect(result).toHaveProperty('month');
    expect(result.month).toBeGreaterThanOrEqual(1);
    expect(result.month).toBeLessThanOrEqual(12);
  });
});
