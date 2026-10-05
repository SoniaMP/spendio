import { describe, it, expect } from 'vitest';
import {
  isValidMonthKey,
  previousMonthKey,
  nextMonthKey,
} from '../../helpers/monthKeys.ts';

describe('isValidMonthKey', () => {
  it('accepts a well-formed month', () => {
    expect(isValidMonthKey('2026-01')).toBe(true);
    expect(isValidMonthKey('2026-12')).toBe(true);
  });

  it('rejects an out-of-range month', () => {
    expect(isValidMonthKey('2026-00')).toBe(false);
    expect(isValidMonthKey('2026-13')).toBe(false);
  });

  it('rejects anything that is not exactly YYYY-MM', () => {
    expect(isValidMonthKey('2026-1')).toBe(false);
    expect(isValidMonthKey('26-01')).toBe(false);
    expect(isValidMonthKey('2026-01-01')).toBe(false);
    expect(isValidMonthKey('junio')).toBe(false);
    expect(isValidMonthKey('')).toBe(false);
  });
});

describe('previousMonthKey', () => {
  it('steps back within the year', () => {
    expect(previousMonthKey('2026-07')).toBe('2026-06');
  });

  it('crosses the year boundary', () => {
    expect(previousMonthKey('2026-01')).toBe('2025-12');
  });

  it('keeps the two-digit padding', () => {
    expect(previousMonthKey('2026-10')).toBe('2026-09');
  });
});

describe('nextMonthKey', () => {
  it('steps forward within the year', () => {
    expect(nextMonthKey('2026-06')).toBe('2026-07');
  });

  it('crosses the year boundary', () => {
    expect(nextMonthKey('2026-12')).toBe('2027-01');
  });

  it('keeps the two-digit padding', () => {
    expect(nextMonthKey('2026-08')).toBe('2026-09');
  });
});

describe('month key round trips', () => {
  it('next then previous returns the original, across boundaries', () => {
    for (const month of ['2026-01', '2026-06', '2026-12', '2027-01']) {
      expect(previousMonthKey(nextMonthKey(month))).toBe(month);
      expect(nextMonthKey(previousMonthKey(month))).toBe(month);
    }
  });

  it('every produced key is itself valid', () => {
    for (const month of ['2026-01', '2026-12']) {
      expect(isValidMonthKey(previousMonthKey(month))).toBe(true);
      expect(isValidMonthKey(nextMonthKey(month))).toBe(true);
    }
  });
});
