import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { SummaryResponse } from '@/types/summary';

const BASE_URL = '/api/summary';

export async function fetchSummary(
  sheetIds: number[],
  month: string,
): Promise<SummaryResponse> {
  const params = new URLSearchParams({
    sheetIds: sheetIds.join(','),
    month,
  });
  const res = await fetchWithAuth(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}
