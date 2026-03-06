import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSheets,
  createSheet,
  updateSheet,
  deleteSheet,
  reorderSheets,
} from '@/api/sheets';
import type { Sheet } from '@/types/sheet';

const SHEETS_KEY = ['sheets'] as const;

export function useSheets() {
  return useQuery({
    queryKey: [...SHEETS_KEY],
    queryFn: fetchSheets,
  });
}

export function useCreateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createSheet(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHEETS_KEY });
    },
  });
}

export function useUpdateSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateSheet(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHEETS_KEY });
    },
  });
}

export function useDeleteSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHEETS_KEY });
    },
  });
}

export function useReorderSheets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: number[]) => reorderSheets(orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: SHEETS_KEY });
      const previous = queryClient.getQueryData<Sheet[]>(SHEETS_KEY);
      queryClient.setQueryData<Sheet[]>(SHEETS_KEY, (old) => {
        if (!old) return old;
        return orderedIds
          .map((id) => old.find((s) => s.id === id))
          .filter((s): s is Sheet => !!s);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SHEETS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SHEETS_KEY });
    },
  });
}
