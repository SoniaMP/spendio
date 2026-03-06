import type { Sheet } from '@/types/sheet';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const BASE_URL = '/api/sheets';

export async function fetchSheets(): Promise<Sheet[]> {
  const res = await fetchWithAuth(BASE_URL);
  if (!res.ok) throw new Error('Failed to fetch sheets');
  return res.json();
}

export async function createSheet(name: string): Promise<Sheet> {
  const res = await fetchWithAuth(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create sheet');
  }
  return res.json();
}

export async function updateSheet(
  id: number,
  name: string,
): Promise<Sheet> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update sheet');
  }
  return res.json();
}

export async function deleteSheet(id: number): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to delete sheet');
  }
}
