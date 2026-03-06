import type { Expense, ExpenseWithCategory } from '@/types/expense';

const BASE_URL = '/api/expenses';

export async function fetchExpenses(
  sheetId: number,
  month?: string,
): Promise<ExpenseWithCategory[]> {
  const params = new URLSearchParams({ sheetId: String(sheetId) });
  if (month) params.set('month', month);
  const res = await fetch(`${BASE_URL}?${params}`);
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
  const res = await fetch(BASE_URL, {
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
}

export async function updateExpense(
  id: number,
  body: UpdateExpenseInput,
): Promise<Expense> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update expense');
  }
  return res.json();
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to delete expense');
  }
}
