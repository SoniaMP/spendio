import type { SheetShare } from '@/types/sheet';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

function baseUrl(sheetId: number) {
  return `/api/sheets/${sheetId}/shares`;
}

export async function fetchSheetShares(sheetId: number): Promise<SheetShare[]> {
  const res = await fetchWithAuth(baseUrl(sheetId));
  if (!res.ok) throw new Error('Failed to fetch shares');
  return res.json();
}

export async function createSheetShare(
  sheetId: number,
  email: string,
  permission: 'read' | 'edit',
): Promise<void> {
  const res = await fetchWithAuth(baseUrl(sheetId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, permission }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to share sheet');
  }
}

export async function updateSheetShare(
  sheetId: number,
  shareId: number,
  permission: 'read' | 'edit',
): Promise<void> {
  const res = await fetchWithAuth(`${baseUrl(sheetId)}/${shareId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permission }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update share');
  }
}

export async function deleteSheetShare(
  sheetId: number,
  shareId: number,
): Promise<void> {
  const res = await fetchWithAuth(`${baseUrl(sheetId)}/${shareId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to delete share');
  }
}

export async function leaveSheet(sheetId: number): Promise<void> {
  const res = await fetchWithAuth(`${baseUrl(sheetId)}/leave`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to leave sheet');
  }
}
