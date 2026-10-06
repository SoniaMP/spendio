import type { IncomeChangeScope } from '@shared/incomeChangeScope';
import type { IncomeLine, MonthlyIncome } from '@/types/income';
import { fetchWithAuth } from '@/lib/fetchWithAuth';

const MONTHLY_INCOME_URL = '/api/monthly-income';
const INCOME_LINES_URL = '/api/income-lines';

export async function fetchMonthlyIncome(month: string): Promise<MonthlyIncome> {
  const params = new URLSearchParams({ month });
  const res = await fetchWithAuth(`${MONTHLY_INCOME_URL}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch monthly income');
  return res.json();
}

export interface CreateIncomeLineInput {
  label: string;
  amount: number;
  month: string;
  isRecurring: boolean;
}

export async function createIncomeLine(
  body: CreateIncomeLineInput,
): Promise<IncomeLine> {
  const res = await fetchWithAuth(INCOME_LINES_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to create income line');
  }
  return res.json();
}

export interface UpdateIncomeLineInput {
  label?: string;
  amount?: number;
  /** Month on screen; the amount change is applied relative to it. */
  month: string;
  scope?: IncomeChangeScope;
}

export async function updateIncomeLine(
  id: number,
  body: UpdateIncomeLineInput,
): Promise<IncomeLine[]> {
  const res = await fetchWithAuth(`${INCOME_LINES_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to update income line');
  }
  return res.json();
}

/**
 * Cancels a line from `month` onwards. The server closes the interval at the
 * previous month rather than deleting rows, so closed months keep counting it.
 */
export async function cancelIncomeLine(id: number, month: string): Promise<void> {
  const params = new URLSearchParams({ month });
  const res = await fetchWithAuth(`${INCOME_LINES_URL}/${id}?${params}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'Failed to cancel income line');
  }
}
