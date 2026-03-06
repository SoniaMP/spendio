import { describe, it, expect } from 'vitest';
import { getComparisonMonths } from '@/helpers/getComparisonMonths';

describe('getComparisonMonths', () => {
  it('returns 12 months by default', () => {
    const result = getComparisonMonths(2026, 3);
    expect(result).toHaveLength(12);
  });

  it('starts from the previous month', () => {
    const result = getComparisonMonths(2026, 3);
    expect(result[0].key).toBe('2026-02');
  });

  it('handles year boundary', () => {
    const result = getComparisonMonths(2026, 1, 3);
    expect(result[0].key).toBe('2025-12');
    expect(result[1].key).toBe('2025-11');
    expect(result[2].key).toBe('2025-10');
  });

  it('respects custom count', () => {
    const result = getComparisonMonths(2026, 6, 3);
    expect(result).toHaveLength(3);
  });
});
