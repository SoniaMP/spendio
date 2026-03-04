import * as XLSX from 'xlsx';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from './formatCurrency';

interface ExportRow {
  Fecha: string;
  Descripción: string;
  Categoría: string;
  Importe: string;
}

export function exportToExcel(
  expenses: ExpenseWithCategory[],
  fileName: string,
): void {
  const rows: ExportRow[] = expenses.map((e) => ({
    Fecha: e.date,
    Descripción: e.description,
    Categoría: e.category_name,
    Importe: formatCurrency(e.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos');
  XLSX.writeFile(wb, fileName);
}
