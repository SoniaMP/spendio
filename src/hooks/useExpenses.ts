import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from '@/api/expenses';

const EXPENSES_KEY = ['expenses'] as const;

function expensesQueryKey(month?: string) {
  return month ? [...EXPENSES_KEY, month] : [...EXPENSES_KEY];
}

export function useExpenses(month?: string) {
  return useQuery({
    queryKey: expensesQueryKey(month),
    queryFn: () => fetchExpenses(month),
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
    mutationFn: ({ id, ...body }: { id: number } & UpdateExpenseInput) =>
      updateExpense(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
    },
  });
}
