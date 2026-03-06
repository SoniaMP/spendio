import type { CategoryBreakdown } from '@/types/chartData';

export interface CategoryComparisonItem {
  categoryName: string;
  color: string;
  currentAmount: number;
  comparisonAmount: number;
  difference: number;
  percentageChange: number | null;
}

export function calcCategoryComparison(
  current: CategoryBreakdown[],
  comparison: CategoryBreakdown[],
): CategoryComparisonItem[] {
  const comparisonMap = new Map(
    comparison.map((c) => [c.categoryName, c]),
  );

  const allNames = new Set([
    ...current.map((c) => c.categoryName),
    ...comparison.map((c) => c.categoryName),
  ]);

  return Array.from(allNames)
    .map((name) => {
      const cur = current.find((c) => c.categoryName === name);
      const comp = comparisonMap.get(name);
      const currentAmount = cur?.amount ?? 0;
      const comparisonAmount = comp?.amount ?? 0;
      const difference = currentAmount - comparisonAmount;

      return {
        categoryName: name,
        color: cur?.color ?? comp?.color ?? '#888',
        currentAmount,
        comparisonAmount,
        difference,
        percentageChange:
          comparisonAmount === 0
            ? null
            : (difference / comparisonAmount) * 100,
      };
    })
    .sort((a, b) => b.currentAmount - a.currentAmount);
}
