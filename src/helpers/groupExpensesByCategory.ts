import type { ExpenseWithCategory } from '@/types/expense';
import type { CategoryBreakdown } from '@/types/chartData';

export function groupExpensesByCategory(
  expenses: ExpenseWithCategory[],
): CategoryBreakdown[] {
  if (expenses.length === 0) return [];

  const map = new Map<string, { color: string; amount: number }>();

  for (const expense of expenses) {
    const existing = map.get(expense.category_name);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      map.set(expense.category_name, {
        color: expense.category_color,
        amount: expense.amount,
      });
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return Array.from(map.entries())
    .map(([categoryName, { color, amount }]) => ({
      categoryName,
      color,
      amount,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}
