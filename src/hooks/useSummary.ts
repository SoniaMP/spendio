import { useQuery } from '@tanstack/react-query';
import { fetchSummary } from '@/api/summary';

const SUMMARY_KEY = ['summary'] as const;

export function useSummary(sheetIds: number[], from: string, to: string) {
  return useQuery({
    queryKey: [...SUMMARY_KEY, sheetIds, from, to],
    queryFn: () => fetchSummary(sheetIds, from, to),
    enabled: sheetIds.length > 0,
  });
}
