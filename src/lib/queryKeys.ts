/**
 * Root segments of the react-query cache keys that more than one module needs.
 * Keeping them here is what lets `invalidateExpenseDependents` and the hooks
 * that own the data agree on a key without importing each other.
 */
export const QueryKeyRoot = {
  Expenses: 'expenses',
  MonthlyIncome: 'monthly-income',
} as const;

export type QueryKeyRoot = (typeof QueryKeyRoot)[keyof typeof QueryKeyRoot];
