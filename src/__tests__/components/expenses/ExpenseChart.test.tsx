import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExpenseWithCategory } from '@/types/expense';
import ExpenseChart from '@/components/expenses/ExpenseChart';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div />,
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}));

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

describe('ExpenseChart', () => {
  it('returns null for empty expenses', () => {
    const { container } = render(<ExpenseChart expenses={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and legend', () => {
    const expenses = [
      makeExpense(),
      makeExpense({ id: 2, amount: 50, category_name: 'Transporte', category_color: '#3B82F6' }),
    ];

    render(<ExpenseChart expenses={expenses} />);

    expect(screen.getByText('Gastos por categoría')).toBeInTheDocument();
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });

  it('shows pie chart by default and switches to bar chart', async () => {
    const user = userEvent.setup();
    const expenses = [makeExpense()];

    render(<ExpenseChart expenses={expenses} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

    await user.click(screen.getByText('Barras'));

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});
