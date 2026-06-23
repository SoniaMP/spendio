import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SheetDetailPage from '@/components/summary/SheetDetailPage';
import type { ExpenseWithCategory } from '@/types/expense';

let mockExpenses: { data: ExpenseWithCategory[]; isLoading: boolean; isError: boolean };

vi.mock('@/hooks/useExpenses', () => ({
  useExpensesByRange: () => mockExpenses,
}));

vi.mock('@/hooks/useSheets', () => ({
  useSheets: () => ({ data: [{ id: 7, name: 'Personal' }] }),
}));

const expense: ExpenseWithCategory = {
  id: 1,
  amount: 50,
  description: 'Compra',
  date: '2026-01-10',
  category_id: 3,
  sheet_id: 7,
  user_id: 1,
  recurring_id: null,
  created_at: '',
  updated_at: '',
  category_name: 'Alimentación',
  category_color: '#EF4444',
};

function renderPage(search = '?from=2026-01-01&to=2026-01-31') {
  return render(
    <MemoryRouter initialEntries={[`/summary/sheet/7${search}`]}>
      <Routes>
        <Route path="/summary/sheet/:sheetId" element={<SheetDetailPage />} />
        <Route path="/summary" element={<div>Resumen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SheetDetailPage', () => {
  beforeEach(() => {
    mockExpenses = { data: [expense], isLoading: false, isError: false };
  });

  it('renders the sheet name, range and expenses', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Personal/ })).toBeInTheDocument();
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
  });

  it('shows the category name in the heading when filtered by category', () => {
    renderPage('?from=2026-01-01&to=2026-01-31&categoryId=3');
    expect(
      screen.getByRole('heading', { name: /Personal.*Alimentación/ }),
    ).toBeInTheDocument();
  });

  it('shows an empty state when there are no expenses', () => {
    mockExpenses = { data: [], isLoading: false, isError: false };
    renderPage();
    expect(screen.getByText('No hay gastos en este periodo.')).toBeInTheDocument();
  });

  it('redirects to summary when the date range is missing', () => {
    renderPage('');
    expect(screen.getByText('Resumen')).toBeInTheDocument();
  });
});
