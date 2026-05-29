import type {
  RecurringExpense,
  RecurringPeriod,
} from '@/types/recurringExpense';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const BASE_URL = '/api/recurring-expenses';

export async function fetchRecurringExpenses(
  sheetId: number,
): Promise<RecurringExpense[]> {
  const params = new URLSearchParams({ sheetId: String(sheetId) });
  const res = await fetchWithAuth(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch recurring expenses');
  return res.json();
}

export interface CreateRecurringInput {
  amount: number;
  description?: string;
  categoryId: number;
  period: RecurringPeriod;
  startDate: string;
  endDate?: string | null;
  noticeDays?: number;
  sheetId: number;
}

export async function createRecurringExpense(
  body: CreateRecurringInput,
): Promise<RecurringExpense> {
  const res = await fetchWithAuth(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create recurring expense');
  }
  return res.json();
}

export interface UpdateRecurringInput {
  amount?: number;
  description?: string;
  categoryId?: number | null;
  period?: RecurringPeriod;
  startDate?: string;
  endDate?: string | null;
  noticeDays?: number;
}

export async function updateRecurringExpense(
  id: number,
  body: UpdateRecurringInput,
): Promise<RecurringExpense> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update recurring expense');
  }
  return res.json();
}

export async function toggleRecurringExpense(
  id: number,
  isActive: boolean,
): Promise<RecurringExpense> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}/active`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to toggle recurring expense');
  }
  return res.json();
}

export async function deleteRecurringExpense(id: number): Promise<void> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to delete recurring expense');
  }
}
