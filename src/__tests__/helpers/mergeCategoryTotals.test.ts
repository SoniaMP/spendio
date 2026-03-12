import { describe, it, expect } from 'vitest';
import { mergeCategoryTotals } from '@/helpers/mergeCategoryTotals';
import type { CategoryTotal } from '@/types/summary';

const makeCat = (overrides: Partial<CategoryTotal> = {}): CategoryTotal => ({
  categoryId: 1,
  categoryName: 'Alimentación',
  categoryColor: '#EF4444',
  total: 100,
  count: 5,
  ...overrides,
});

describe('mergeCategoryTotals', () => {
  it('returns empty array for no sheets', () => {
    expect(mergeCategoryTotals([])).toEqual([]);
  });

  it('returns categories from single sheet unchanged', () => {
    const result = mergeCategoryTotals([
      { categories: [makeCat(), makeCat({ categoryId: 2, categoryName: 'Transporte', total: 50, count: 2 })] },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].total).toBe(100);
    expect(result[1].total).toBe(50);
  });

  it('merges same categories across sheets', () => {
    const result = mergeCategoryTotals([
      { categories: [makeCat({ total: 60, count: 3 })] },
      { categories: [makeCat({ total: 40, count: 2 })] },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].total).toBe(100);
    expect(result[0].count).toBe(5);
  });

  it('sorts by total descending', () => {
    const result = mergeCategoryTotals([
      {
        categories: [
          makeCat({ categoryId: 1, categoryName: 'A', total: 20 }),
          makeCat({ categoryId: 2, categoryName: 'B', total: 80 }),
        ],
      },
    ]);
    expect(result[0].categoryName).toBe('B');
    expect(result[1].categoryName).toBe('A');
  });

  it('handles sheets with empty categories', () => {
    const result = mergeCategoryTotals([
      { categories: [] },
      { categories: [makeCat()] },
    ]);
    expect(result).toHaveLength(1);
  });
});
