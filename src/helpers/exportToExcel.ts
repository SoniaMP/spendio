import * as XLSX from 'xlsx';
import i18next from 'i18next';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';

/**
 * `json_to_sheet` turns object keys into column headers, so the keys here are
 * the translated labels rather than technical names. Not a hook, so the copy
 * comes straight from i18next.
 */
type ExportRow = Record<string, string>;

export function exportToExcel(
  expenses: ExpenseWithCategory[],
  fileName: string,
): void {
  const headers = {
    date: i18next.t('expenses.columns.date'),
    description: i18next.t('expenses.columns.description'),
    category: i18next.t('expenses.columns.category'),
    amount: i18next.t('expenses.columns.amount'),
  };

  const rows: ExportRow[] = expenses.map((e) => ({
    [headers.date]: formatDate(e.date),
    [headers.description]: e.description,
    [headers.category]: e.category_name,
    [headers.amount]: formatCurrency(e.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, i18next.t('expenses.sheetName'));
  XLSX.writeFile(wb, fileName);
}
