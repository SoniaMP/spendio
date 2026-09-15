import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import i18next from 'i18next';
import { formatDate } from '@/helpers/formatDate';
import { formatCurrency } from '@/helpers/formatCurrency';
import { getMonthLabel, formatDateRangeLabel } from '@/helpers/dateHelpers';

/**
 * The Spanish side of these helpers is covered by the per-helper test files.
 * This one pins the English side, which is what the format layer added.
 */
describe('formatting follows the active language', () => {
  afterEach(async () => {
    await i18next.changeLanguage('es');
  });

  it('formats dates with the English locale', async () => {
    expect(formatDate('2026-03-04')).toBe('4 mar 2026');

    await i18next.changeLanguage('en');

    expect(formatDate('2026-03-04')).toBe('Mar 4, 2026');
  });

  it('keeps EUR but moves the symbol and separators', async () => {
    expect(formatCurrency(1234.5)).toBe('1234,50 €');

    await i18next.changeLanguage('en');

    expect(formatCurrency(1234.5)).toBe('€1,234.50');
  });

  it('formats month labels and ranges in English', async () => {
    expect(getMonthLabel(2026, 3)).toBe('marzo 2026');
    expect(formatDateRangeLabel('2026-03-01', '2026-03-31')).toBe(
      '1 mar 2026 – 31 mar 2026',
    );

    await i18next.changeLanguage('en');

    expect(getMonthLabel(2026, 3)).toBe('March 2026');
    expect(formatDateRangeLabel('2026-03-01', '2026-03-31')).toBe(
      'Mar 1, 2026 – Mar 31, 2026',
    );
  });

  it('falls back to Spanish formatting for an unsupported language', async () => {
    await i18next.changeLanguage('fr');

    expect(formatDate('2026-03-04')).toBe('4 mar 2026');
    expect(formatCurrency(25.5)).toBe('25,50 €');
  });
});

describe('Excel export follows the active language', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(async () => {
    await i18next.changeLanguage('es');
  });

  it('translates the column headers, sheet name and file name', async () => {
    const jsonToSheet = vi.fn(() => ({}));
    const bookAppendSheet = vi.fn();
    const writeFile = vi.fn();

    vi.doMock('xlsx', () => ({
      utils: {
        json_to_sheet: jsonToSheet,
        book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
        book_append_sheet: bookAppendSheet,
      },
      writeFile,
    }));

    const { exportToExcel } = await import('@/helpers/exportToExcel');
    await i18next.changeLanguage('en');

    exportToExcel(
      [
        {
          id: 1,
          amount: 25.5,
          description: 'Groceries',
          date: '2026-03-01',
          category_id: 1,
          sheet_id: 1,
          user_id: 1,
          recurring_id: null,
          category_name: 'Food',
          category_color: '#EF4444',
          created_at: '2026-03-01T00:00:00',
          updated_at: '2026-03-01T00:00:00',
        },
      ],
      i18next.t('expenses.exportFileName', { month: 'march-2026' }),
    );

    expect(jsonToSheet).toHaveBeenCalledWith([
      {
        Date: 'Mar 1, 2026',
        Description: 'Groceries',
        Category: 'Food',
        Amount: '€25.50',
      },
    ]);
    expect(bookAppendSheet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      'Expenses',
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.any(Object),
      'expenses-march-2026.xlsx',
    );
  });
});
