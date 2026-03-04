import { describe, it, expect } from 'vitest';
import type { ExpenseWithCategory } from '@/types/expense';
import { groupExpensesByCategory } from '@/helpers/groupExpensesByCategory';

const makeExpense = (
  overrides: Partial<ExpenseWithCategory> = {},
): ExpenseWithCategory => ({
  id: 1,
  amount: 25.5,
  description: 'Supermercado',
  date: '2026-03-01',
  category_id: 1,
  category_name: 'Alimentación',
  category_color: '#EF4444',
  created_at: '2026-03-01T00:00:00',
  updated_at: '2026-03-01T00:00:00',
  ...overrides,
});

describe('groupExpensesByCategory', () => {
  it('returns empty array for empty input', () => {
    expect(groupExpensesByCategory([])).toEqual([]);
  });

  it('aggregates amounts per category', () => {
    const expenses = [
      makeExpense({ amount: 30, category_name: 'Alimentación', category_color: '#EF4444' }),
      makeExpense({ id: 2, amount: 20, category_name: 'Alimentación', category_color: '#EF4444' }),
      makeExpense({ id: 3, amount: 50, category_name: 'Transporte', category_color: '#3B82F6' }),
    ];

    const result = groupExpensesByCategory(expenses);

    expect(result).toHaveLength(2);
    const alimentacion = result.find((r) => r.categoryName === 'Alimentación');
    expect(alimentacion?.amount).toBe(50);
    const transporte = result.find((r) => r.categoryName === 'Transporte');
    expect(transporte?.amount).toBe(50);
  });

  it('sorts by amount descending', () => {
    const expenses = [
      makeExpense({ amount: 10, category_name: 'Ocio', category_color: '#A855F7' }),
      makeExpense({ id: 2, amount: 50, category_name: 'Transporte', category_color: '#3B82F6' }),
      makeExpense({ id: 3, amount: 30, category_name: 'Alimentación', category_color: '#EF4444' }),
    ];

    const result = groupExpensesByCategory(expenses);

    expect(result[0].categoryName).toBe('Transporte');
    expect(result[1].categoryName).toBe('Alimentación');
    expect(result[2].categoryName).toBe('Ocio');
  });

  it('calculates percentages that sum to 100', () => {
    const expenses = [
      makeExpense({ amount: 60, category_name: 'Alimentación', category_color: '#EF4444' }),
      makeExpense({ id: 2, amount: 40, category_name: 'Transporte', category_color: '#3B82F6' }),
    ];

    const result = groupExpensesByCategory(expenses);
    const totalPercentage = result.reduce((sum, r) => sum + r.percentage, 0);

    expect(totalPercentage).toBeCloseTo(100);
    expect(result[0].percentage).toBeCloseTo(60);
    expect(result[1].percentage).toBeCloseTo(40);
  });

  it('handles single category', () => {
    const expenses = [
      makeExpense({ amount: 100, category_name: 'Alimentación', category_color: '#EF4444' }),
    ];

    const result = groupExpensesByCategory(expenses);

    expect(result).toHaveLength(1);
    expect(result[0].categoryName).toBe('Alimentación');
    expect(result[0].color).toBe('#EF4444');
    expect(result[0].amount).toBe(100);
    expect(result[0].percentage).toBeCloseTo(100);
  });
});
