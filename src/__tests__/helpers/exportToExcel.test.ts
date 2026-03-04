import { describe, it, expect, vi } from 'vitest';
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

describe('exportToExcel', () => {
  const expenses: ExpenseWithCategory[] = [
    {
      id: 1,
      amount: 25.5,
      description: 'Supermercado',
      date: '2026-03-01',
      category_id: 1,
      category_name: 'Alimentación',
      category_color: '#EF4444',
      created_at: '2026-03-01T00:00:00',
      updated_at: '2026-03-01T00:00:00',
    },
  ];

  it('calls XLSX.writeFile with the correct filename', () => {
    exportToExcel(expenses, 'gastos-marzo.xlsx');
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'gastos-marzo.xlsx',
    );
  });

  it('creates a sheet from mapped rows', () => {
    exportToExcel(expenses, 'test.xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
      {
        Fecha: '2026-03-01',
        Descripción: 'Supermercado',
        Categoría: 'Alimentación',
        Importe: expect.any(String),
      },
    ]);
  });
});
