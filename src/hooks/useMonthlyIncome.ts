import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMonthlyIncome,
  createIncomeLine,
  updateIncomeLine,
  cancelIncomeLine,
  type CreateIncomeLineInput,
  type UpdateIncomeLineInput,
} from '@/api/income';
import { QueryKeyRoot } from '@/lib/queryKeys';

const MONTHLY_INCOME_KEY = [QueryKeyRoot.MonthlyIncome] as const;

export function useMonthlyIncome(month: string) {
  return useQuery({
    queryKey: [...MONTHLY_INCOME_KEY, month],
    queryFn: () => fetchMonthlyIncome(month),
    enabled: month !== '',
  });
}

export function useCreateIncomeLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateIncomeLineInput) => createIncomeLine(body),
    onSuccess: () => {
      // Every month from the new line's start onwards changes, so the whole
      // root is invalidated rather than a single month's key.
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_KEY });
    },
  });
}

export function useUpdateIncomeLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & UpdateIncomeLineInput) =>
      updateIncomeLine(id, body),
    onSuccess: () => {
      // A scoped change rewrites several intervals at once, so no single month's
      // key is enough.
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_KEY });
    },
  });
}

export function useCancelIncomeLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, month }: { id: number; month: string }) =>
      cancelIncomeLine(id, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MONTHLY_INCOME_KEY });
    },
  });
}
