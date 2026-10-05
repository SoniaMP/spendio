import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  fetchExpensesByRange,
  createExpense,
  updateExpense,
  duplicateExpense,
  deleteExpense,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type DuplicateExpenseInput,
  type RecurringScope,
} from '@/api/expenses';
import { invalidateExpenseDependents } from '@/lib/invalidateExpenseDependents';
import { QueryKeyRoot } from '@/lib/queryKeys';

const EXPENSES_KEY = [QueryKeyRoot.Expenses] as const;

function expensesQueryKey(sheetId: number, month?: string) {
  return month
    ? [...EXPENSES_KEY, sheetId, month]
    : [...EXPENSES_KEY, sheetId];
}

export function useExpenses(sheetId: number, month?: string) {
  return useQuery({
    queryKey: expensesQueryKey(sheetId, month),
    queryFn: () => fetchExpenses(sheetId, month),
  });
}

export function useExpensesByRange(
  sheetId: number,
  from: string,
  to: string,
  categoryId?: number,
) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, sheetId, from, to, categoryId ?? null],
    queryFn: () => fetchExpensesByRange(sheetId, from, to, categoryId),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateExpenseInput) => createExpense(body),
    onSuccess: () => {
      invalidateExpenseDependents(queryClient);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      scope,
      ...body
    }: { id: number; scope?: RecurringScope } & UpdateExpenseInput) =>
      updateExpense(id, body, scope),
    onSuccess: () => {
      invalidateExpenseDependents(queryClient);
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useDuplicateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & DuplicateExpenseInput) =>
      duplicateExpense(id, body),
    onSuccess: () => {
      invalidateExpenseDependents(queryClient);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scope }: { id: number; scope?: RecurringScope }) =>
      deleteExpense(id, scope),
    onSuccess: () => {
      invalidateExpenseDependents(queryClient);
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}
