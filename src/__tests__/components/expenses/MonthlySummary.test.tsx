import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthlySummary from '@/components/expenses/MonthlySummary';
import type { CategoryBreakdown } from '@/types/chartData';
import type { MonthOption } from '@/helpers/getComparisonMonths';

const currentBreakdown: CategoryBreakdown[] = [
  { categoryName: 'Comida', color: '#f00', amount: 500, percentage: 63 },
  { categoryName: 'Transporte', color: '#0f0', amount: 300, percentage: 37 },
];

const comparisonBreakdown: CategoryBreakdown[] = [
  { categoryName: 'Comida', color: '#f00', amount: 400, percentage: 62 },
  { categoryName: 'Transporte', color: '#0f0', amount: 250, percentage: 38 },
];

const monthOptions: MonthOption[] = [
  { key: '2026-02', label: 'febrero 2026' },
  { key: '2026-01', label: 'enero 2026' },
];

const defaultProps = {
  currentTotal: 800,
  currentBreakdown,
  comparisonBreakdown,
  comparisonMonthKey: '2026-02',
  monthOptions,
  isComparisonLoading: false,
  onComparisonMonthChange: vi.fn(),
};

describe('MonthlySummary', () => {
  it('renders the month total', () => {
    render(<MonthlySummary {...defaultProps} />);
    expect(screen.getByText('Total del mes')).toBeInTheDocument();
    expect(screen.getByText(/800,00/)).toBeInTheDocument();
  });

  it('renders the total comparison badge against selected month', () => {
    render(<MonthlySummary {...defaultProps} />);
    expect(screen.getAllByText(/febrero 2026/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders category comparison list', () => {
    render(<MonthlySummary {...defaultProps} />);
    expect(screen.getByText('Comida')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MonthlySummary {...defaultProps} isComparisonLoading={true} />);
    expect(screen.getAllByText('Cargando...').length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no data', () => {
    render(
      <MonthlySummary
        {...defaultProps}
        currentBreakdown={[]}
        comparisonBreakdown={[]}
        currentTotal={0}
      />,
    );
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('renders the month selector', () => {
    render(<MonthlySummary {...defaultProps} />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
  });

  it('renders the section title', () => {
    render(<MonthlySummary {...defaultProps} />);
    expect(screen.getByText('Comparar por categoria')).toBeInTheDocument();
  });
});
