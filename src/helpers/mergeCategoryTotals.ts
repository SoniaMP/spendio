import type { CategoryTotal } from '@/types/summary';

export function mergeCategoryTotals(
  sheets: { categories: CategoryTotal[] }[],
): CategoryTotal[] {
  const map = new Map<number, CategoryTotal>();

  for (const sheet of sheets) {
    for (const cat of sheet.categories) {
      const existing = map.get(cat.categoryId);
      if (existing) {
        existing.total += cat.total;
        existing.count += cat.count;
      } else {
        map.set(cat.categoryId, { ...cat });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
