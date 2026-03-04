import { describe, it, expect } from 'vitest';
import { formatDate } from '@/helpers/formatDate';

describe('formatDate', () => {
  it('formats an ISO date string in Spanish', () => {
    const result = formatDate('2026-03-04');
    expect(result).toBe('4 mar 2026');
  });

  it('formats a date in December', () => {
    const result = formatDate('2025-12-25');
    expect(result).toBe('25 dic 2025');
  });

  it('formats a date in January', () => {
    const result = formatDate('2026-01-01');
    expect(result).toBe('1 ene 2026');
  });
});
