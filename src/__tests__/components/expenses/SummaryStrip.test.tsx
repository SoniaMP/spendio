import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SummaryStrip from '@/components/expenses/SummaryStrip';
import type { CategoryBreakdown } from '@/types/chartData';

const defaultProps = {
  currentTotal: 800,
  comparison: { percentageChange: 12, direction: 'up' as const },
  previousMonthLabel: 'febrero',
  isComparisonLoading: false,
  topCategories: [
    { categoryName: 'Comida', color: '#ff0000', amount: 450, percentage: 56 },
    { categoryName: 'Transporte', color: '#00ff00', amount: 200, percentage: 25 },
  ] satisfies CategoryBreakdown[],
};

describe('SummaryStrip', () => {
  it('renders the month total', () => {
    render(<SummaryStrip {...defaultProps} />);
    expect(screen.getByText('Total del mes')).toBeInTheDocument();
    expect(screen.getByText(/800,00/)).toBeInTheDocument();
  });

  it('renders the comparison badge', () => {
    render(<SummaryStrip {...defaultProps} />);
    expect(screen.getByText(/12,0% vs febrero/)).toBeInTheDocument();
  });

  it('renders top categories', () => {
    render(<SummaryStrip {...defaultProps} />);
    expect(screen.getByText(/Comida/)).toBeInTheDocument();
    expect(screen.getByText(/Transporte/)).toBeInTheDocument();
  });

  it('shows loading state for comparison', () => {
    render(<SummaryStrip {...defaultProps} isComparisonLoading={true} />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });
});
