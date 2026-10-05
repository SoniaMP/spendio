import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { QueryKeyRoot } from '@/lib/queryKeys';

/**
 * The plan's highest practical risk: eight mutation sites change the set of
 * expenses, and every one of them has to invalidate the monthly-income cache or
 * the chip keeps showing a remaining that no longer matches what the user just
 * logged. This suite pins all eight, so adding a ninth without wiring it up
 * fails here instead of shipping a silently stale figure.
 */
vi.mock('@/api/expenses', () => ({
  fetchExpenses: vi.fn(),
  fetchExpensesByRange: vi.fn(),
  createExpense: vi.fn().mockResolvedValue({ id: 1 }),
  updateExpense: vi.fn().mockResolvedValue({ id: 1 }),
  duplicateExpense: vi.fn().mockResolvedValue({ id: 2 }),
  deleteExpense: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/api/recurring', () => ({
  fetchRecurringExpenses: vi.fn(),
  createRecurringExpense: vi.fn().mockResolvedValue({ id: 1 }),
  updateRecurringExpense: vi.fn().mockResolvedValue({ id: 1 }),
  toggleRecurringExpense: vi.fn().mockResolvedValue({ id: 1 }),
  deleteRecurringExpense: vi.fn().mockResolvedValue(undefined),
}));

import {
  useCreateExpense,
  useUpdateExpense,
  useDuplicateExpense,
  useDeleteExpense,
} from '@/hooks/useExpenses';
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useToggleRecurringExpense,
  useDeleteRecurringExpense,
} from '@/hooks/useRecurringExpenses';

let queryClient: QueryClient;
const invalidateQueries = vi.fn();

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  invalidateQueries.mockClear();
  queryClient.invalidateQueries =
    invalidateQueries as unknown as QueryClient['invalidateQueries'];
});

function invalidatedRoots(): string[] {
  return invalidateQueries.mock.calls
    .map((call: unknown[]) => (call[0] as { queryKey?: unknown[] } | undefined)?.queryKey?.[0])
    .filter((root): root is string => typeof root === 'string');
}

const MUTATIONS = [
  { name: 'create expense', hook: useCreateExpense, variables: { amount: 10 } },
  { name: 'update expense', hook: useUpdateExpense, variables: { id: 1, amount: 10 } },
  { name: 'duplicate expense', hook: useDuplicateExpense, variables: { id: 1, targetSheetId: 1 } },
  { name: 'delete expense', hook: useDeleteExpense, variables: { id: 1 } },
  { name: 'create recurring', hook: useCreateRecurringExpense, variables: { amount: 10 } },
  { name: 'update recurring', hook: useUpdateRecurringExpense, variables: { id: 1, amount: 10 } },
  { name: 'toggle recurring', hook: useToggleRecurringExpense, variables: { id: 1, isActive: false } },
  { name: 'delete recurring', hook: useDeleteRecurringExpense, variables: 1 },
] as const;

describe('every expense mutation invalidates the monthly income', () => {
  for (const { name, hook, variables } of MUTATIONS) {
    it(`${name} invalidates both expenses and monthly-income`, async () => {
      const { result } = renderHook(() => hook(), { wrapper });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each hook takes its own variables shape
      result.current.mutate(variables as any);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const roots = invalidatedRoots();
      expect(roots).toContain(QueryKeyRoot.Expenses);
      expect(roots).toContain(QueryKeyRoot.MonthlyIncome);
    });
  }
});
