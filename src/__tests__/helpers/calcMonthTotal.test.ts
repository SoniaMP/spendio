import { describe, it, expect } from 'vitest';
import { calcMonthTotal } from '@/helpers/calcMonthTotal';
import { ExpenseWithCategory } from '@/types/expense';

function makeExpense(amount: number): ExpenseWithCategory {
  return {
    id: 1,
    amount,
    description: 'test',
    date: '2026-03-01',
    category_id: 1,
    created_at: '2026-03-01',
    updated_at: '2026-03-01',
    category_name: 'Test',
    category_color: '#000',
  };
}

describe('calcMonthTotal', () => {
  it('returns 0 for an empty array', () => {
    expect(calcMonthTotal([])).toBe(0);
  });

  it('returns the amount for a single expense', () => {
    expect(calcMonthTotal([makeExpense(150)])).toBe(150);
  });

  it('sums multiple expenses', () => {
    const expenses = [makeExpense(100), makeExpense(250.5), makeExpense(49.5)];
    expect(calcMonthTotal(expenses)).toBe(400);
  });
});
