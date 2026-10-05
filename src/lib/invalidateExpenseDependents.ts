import type { QueryClient } from '@tanstack/react-query';
import { QueryKeyRoot } from './queryKeys';

/**
 * Invalidates every cache whose data is derived from the set of expenses.
 *
 * Any mutation that creates, edits, moves, duplicates or deletes an expense —
 * including the recurring-expense mutations, which materialize and remove real
 * expense rows — must call this instead of invalidating `['expenses']` by hand.
 * Miss one site and the monthly income chip keeps showing a remaining that no
 * longer matches what the user just logged, which is the one number the whole
 * feature exists to show.
 */
export function invalidateExpenseDependents(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: [QueryKeyRoot.Expenses] });
  queryClient.invalidateQueries({ queryKey: [QueryKeyRoot.MonthlyIncome] });
}
