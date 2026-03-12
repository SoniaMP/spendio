import { useQuery } from '@tanstack/react-query';
import { fetchSummary } from '@/api/summary';

const SUMMARY_KEY = ['summary'] as const;

export function useSummary(sheetIds: number[], month: string) {
  return useQuery({
    queryKey: [...SUMMARY_KEY, sheetIds, month],
    queryFn: () => fetchSummary(sheetIds, month),
    enabled: sheetIds.length > 0,
  });
}
