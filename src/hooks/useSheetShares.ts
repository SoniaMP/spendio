import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSheetShares,
  createSheetShare,
  updateSheetShare,
  deleteSheetShare,
  leaveSheet,
} from '@/api/sheetShares';

function sharesKey(sheetId: number) {
  return ['sheets', sheetId, 'shares'] as const;
}

export function useSheetShares(sheetId: number) {
  return useQuery({
    queryKey: [...sharesKey(sheetId)],
    queryFn: () => fetchSheetShares(sheetId),
    enabled: sheetId > 0,
  });
}

export function useCreateSheetShare(sheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, permission }: { email: string; permission: 'read' | 'edit' }) =>
      createSheetShare(sheetId, email, permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharesKey(sheetId) }),
  });
}

export function useUpdateSheetShare(sheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shareId, permission }: { shareId: number; permission: 'read' | 'edit' }) =>
      updateSheetShare(sheetId, shareId, permission),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sharesKey(sheetId) }),
  });
}

export function useDeleteSheetShare(sheetId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: number) => deleteSheetShare(sheetId, shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sharesKey(sheetId) });
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
    },
  });
}

export function useLeaveSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sheetId: number) => leaveSheet(sheetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheets'] });
    },
  });
}
