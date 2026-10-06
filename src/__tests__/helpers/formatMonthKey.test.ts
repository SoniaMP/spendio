import { describe, it, expect } from 'vitest';
import { formatMonthKey } from '@/helpers/formatMonthKey';

describe('formatMonthKey', () => {
  it('turns a month key into the localized label', () => {
    expect(formatMonthKey('2026-10')).toBe('octubre 2026');
  });

  it('handles both ends of the year', () => {
    expect(formatMonthKey('2026-01')).toBe('enero 2026');
    expect(formatMonthKey('2026-12')).toBe('diciembre 2026');
  });
});
