import { ExpenseWithCategory } from '@/types/expense';

export function calcMonthTotal(expenses: ExpenseWithCategory[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}
