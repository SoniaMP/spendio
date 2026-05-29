import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  duplicateExpense,
  deleteExpense,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type DuplicateExpenseInput,
  type RecurringScope,
} from '@/api/expenses';

const EXPENSES_KEY = ['expenses'] as const;

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

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateExpenseInput) => createExpense(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
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
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
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
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scope }: { id: number; scope?: RecurringScope }) =>
      deleteExpense(id, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}
