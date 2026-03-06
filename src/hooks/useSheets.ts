import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSheets,
  createSheet,
  updateSheet,
  deleteSheet,
} from '@/api/sheets';

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
