import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  toggleRecurringExpense,
  deleteRecurringExpense,
  type CreateRecurringInput,
  type UpdateRecurringInput,
} from '@/api/recurring';

const RECURRING_KEY = ['recurring-expenses'] as const;

function recurringQueryKey(sheetId: number) {
  return [...RECURRING_KEY, sheetId];
}

export function useRecurringExpenses(sheetId: number) {
  return useQuery({
    queryKey: recurringQueryKey(sheetId),
    queryFn: () => fetchRecurringExpenses(sheetId),
    enabled: sheetId > 0,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRecurringInput) => createRecurringExpense(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & UpdateRecurringInput) =>
      updateRecurringExpense(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useToggleRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleRecurringExpense(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_KEY });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
