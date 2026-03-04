import { describe, it, expect } from 'vitest';
import { calcMonthComparison } from '@/helpers/calcMonthComparison';

describe('calcMonthComparison', () => {
  it('returns equal when both totals are zero', () => {
    const result = calcMonthComparison(0, 0);
    expect(result).toEqual({ percentageChange: 0, direction: 'equal' });
  });

  it('returns equal when totals are the same', () => {
    const result = calcMonthComparison(500, 500);
    expect(result).toEqual({ percentageChange: 0, direction: 'equal' });
  });

  it('returns up with 100% when previous is zero', () => {
    const result = calcMonthComparison(300, 0);
    expect(result).toEqual({ percentageChange: 100, direction: 'up' });
  });

  it('returns up when current is greater than previous', () => {
    const result = calcMonthComparison(600, 500);
    expect(result).toEqual({ percentageChange: 20, direction: 'up' });
  });

  it('returns down when current is less than previous', () => {
    const result = calcMonthComparison(400, 500);
    expect(result).toEqual({ percentageChange: 20, direction: 'down' });
  });

  it('handles fractional percentages', () => {
    const result = calcMonthComparison(550, 500);
    expect(result.percentageChange).toBeCloseTo(10);
    expect(result.direction).toBe('up');
  });
});
