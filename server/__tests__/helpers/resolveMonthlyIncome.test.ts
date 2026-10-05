import { describe, it, expect } from 'vitest';
import { resolveMonthlyIncome } from '../../helpers/resolveMonthlyIncome.ts';
import type { IncomeLineRow } from '../../types.ts';

function line(
  label: string,
  amount: number,
  startMonth: string,
  endMonth: string | null,
): IncomeLineRow {
  return {
    id: 1,
    user_id: 1,
    label,
    amount,
    start_month: startMonth,
    end_month: endMonth,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-01 00:00:00',
  };
}

describe('resolveMonthlyIncome', () => {
  it('is zero with no lines in force', () => {
    expect(resolveMonthlyIncome([])).toBe(0);
  });

  it('sums every line in force', () => {
    const lines = [
      line('Nómina', 1600, '2026-01', null),
      line('Freelance', 400, '2026-03', null),
      line('Alquiler', 500, '2026-01', null),
    ];

    expect(resolveMonthlyIncome(lines)).toBe(2500);
  });

  it('adds a single-month line to the recurring ones instead of overriding them', () => {
    const lines = [
      line('Nómina', 1600, '2026-01', null),
      line('Paga extra', 300, '2026-06', '2026-06'),
    ];

    // The rule: additive, no precedence. 1900, not 300.
    expect(resolveMonthlyIncome(lines)).toBe(1900);
  });

  it('handles decimal amounts', () => {
    const lines = [line('Nómina', 1234.56, '2026-01', null), line('Extra', 65.44, '2026-01', null)];

    expect(resolveMonthlyIncome(lines)).toBeCloseTo(1300, 2);
  });
});
