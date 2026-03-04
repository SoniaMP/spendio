import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/helpers/formatCurrency';

describe('formatCurrency', () => {
  it('formats a whole number', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1000');
    expect(result).toContain('€');
  });

  it('formats decimals', () => {
    expect(formatCurrency(25.5)).toBe('25,50\u00a0€');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0,00\u00a0€');
  });

  it('formats negative numbers', () => {
    expect(formatCurrency(-42.1)).toBe('-42,10\u00a0€');
  });
});
