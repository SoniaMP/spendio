import type { Expense, ExpenseWithCategory } from '@/types/expense';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const BASE_URL = '/api/expenses';

export async function fetchExpenses(
  sheetId: number,
  month?: string,
): Promise<ExpenseWithCategory[]> {
  const params = new URLSearchParams({ sheetId: String(sheetId) });
  if (month) params.set('month', month);
  const res = await fetchWithAuth(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
}

export interface CreateExpenseInput {
  amount: number;
  description?: string;
  date: string;
  categoryId: number;
  sheetId: number;
}

export async function createExpense(
  body: CreateExpenseInput,
): Promise<Expense> {
  const res = await fetchWithAuth(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create expense');
  }
  return res.json();
}

export interface UpdateExpenseInput {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: number;
  sheetId?: number;
}

export type RecurringScope = 'this' | 'future';

export async function updateExpense(
  id: number,
  body: UpdateExpenseInput,
  scope?: RecurringScope,
): Promise<Expense> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scope ? { ...body, scope } : body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update expense');
  }
  return res.json();
}

export interface DuplicateExpenseInput {
  targetSheetId: number;
  date: string;
}

export async function duplicateExpense(
  id: number,
  body: DuplicateExpenseInput,
): Promise<Expense> {
  const res = await fetchWithAuth(`${BASE_URL}/${id}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to duplicate expense');
  }
  return res.json();
}

export async function deleteExpense(
  id: number,
  scope?: RecurringScope,
): Promise<void> {
  const url = scope === 'future' ? `${BASE_URL}/${id}?scope=future` : `${BASE_URL}/${id}`;
  const res = await fetchWithAuth(url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to delete expense');
  }
}
