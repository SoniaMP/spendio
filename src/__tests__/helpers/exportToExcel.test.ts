import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExpenseWithCategory } from '@/types/expense';

vi.mock('xlsx', () => {
  const mockWs = {};
  return {
    utils: {
      json_to_sheet: vi.fn(() => mockWs),
      book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

import { exportToExcel } from '@/helpers/exportToExcel';
import * as XLSX from 'xlsx';

const makeExpense = (
  overrides: Partial<ExpenseWithCategory> = {},
): ExpenseWithCategory => ({
  id: 1,
  amount: 25.5,
  description: 'Supermercado',
  date: '2026-03-01',
  category_id: 1,
  category_name: 'Alimentación',
  category_color: '#EF4444',
  created_at: '2026-03-01T00:00:00',
  updated_at: '2026-03-01T00:00:00',
  ...overrides,
});

describe('exportToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls XLSX.writeFile with the correct filename', () => {
    exportToExcel([makeExpense()], 'gastos-marzo.xlsx');
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'gastos-marzo.xlsx',
    );
  });

  it('maps expenses to rows with formatted dates and currency', () => {
    exportToExcel([makeExpense()], 'test.xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      {
        Fecha: '1 mar 2026',
        Descripción: 'Supermercado',
        Categoría: 'Alimentación',
        Importe: expect.stringContaining('25,50'),
      },
    ]);
  });

  it('handles empty expenses array', () => {
    exportToExcel([], 'empty.xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('maps multiple expenses preserving order', () => {
    const expenses = [
      makeExpense({ id: 1, description: 'First', amount: 10 }),
      makeExpense({ id: 2, description: 'Second', amount: 20 }),
    ];
    exportToExcel(expenses, 'multi.xlsx');

    const rows = (XLSX.utils.json_to_sheet as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0].Descripción).toBe('First');
    expect(rows[1].Descripción).toBe('Second');
  });

  it('names the sheet "Gastos"', () => {
    exportToExcel([makeExpense()], 'test.xlsx');
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'Gastos',
    );
  });
});
