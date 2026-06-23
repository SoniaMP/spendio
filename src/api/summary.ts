import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { SummaryResponse } from '@/types/summary';

const BASE_URL = '/api/summary';

export async function fetchSummary(
  sheetIds: number[],
  from: string,
  to: string,
): Promise<SummaryResponse> {
  const params = new URLSearchParams({
    sheetIds: sheetIds.join(','),
    from,
    to,
  });
  const res = await fetchWithAuth(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}
