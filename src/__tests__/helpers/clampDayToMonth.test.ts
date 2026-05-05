import { describe, it, expect } from 'vitest';
import { clampDayToMonth } from '@/helpers/clampDayToMonth';

describe('clampDayToMonth', () => {
  it('keeps the day when the target month has it', () => {
    expect(clampDayToMonth(2026, 5, 15)).toBe('2026-05-15');
  });

  it('clamps Jan 31 to Feb 28 in a non-leap year', () => {
    expect(clampDayToMonth(2026, 2, 31)).toBe('2026-02-28');
  });

  it('clamps Jan 31 to Feb 29 in a leap year', () => {
    expect(clampDayToMonth(2024, 2, 31)).toBe('2024-02-29');
  });

  it('clamps Mar 31 to Apr 30', () => {
    expect(clampDayToMonth(2026, 4, 31)).toBe('2026-04-30');
  });

  it('keeps Dec 31 as is (December has 31 days)', () => {
    expect(clampDayToMonth(2026, 12, 31)).toBe('2026-12-31');
  });

  it('pads single-digit month and day', () => {
    expect(clampDayToMonth(2026, 3, 5)).toBe('2026-03-05');
  });

  it('clamps a day under 1 to 1', () => {
    expect(clampDayToMonth(2026, 5, 0)).toBe('2026-05-01');
  });
});
