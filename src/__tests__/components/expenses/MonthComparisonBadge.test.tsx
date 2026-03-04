import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthComparisonBadge from '@/components/expenses/MonthComparisonBadge';

describe('MonthComparisonBadge', () => {
  it('shows loading state', () => {
    render(
      <MonthComparisonBadge
        comparison={{ percentageChange: 0, direction: 'equal' }}
        previousMonthLabel="febrero"
        isLoading={true}
      />,
    );
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows "Sin datos" when previous month had no data', () => {
    render(
      <MonthComparisonBadge
        comparison={{ percentageChange: 100, direction: 'up' }}
        previousMonthLabel="febrero"
        isLoading={false}
      />,
    );
    expect(screen.getByText('Sin datos de febrero')).toBeInTheDocument();
  });

  it('shows equal message', () => {
    render(
      <MonthComparisonBadge
        comparison={{ percentageChange: 0, direction: 'equal' }}
        previousMonthLabel="febrero"
        isLoading={false}
      />,
    );
    expect(screen.getByText('Igual que febrero')).toBeInTheDocument();
  });

  it('shows down arrow with percentage for spending decrease', () => {
    render(
      <MonthComparisonBadge
        comparison={{ percentageChange: 15.3, direction: 'down' }}
        previousMonthLabel="febrero"
        isLoading={false}
      />,
    );
    expect(screen.getByText('▼ 15,3% vs febrero')).toBeInTheDocument();
  });

  it('shows up arrow with percentage for spending increase', () => {
    render(
      <MonthComparisonBadge
        comparison={{ percentageChange: 8.5, direction: 'up' }}
        previousMonthLabel="enero"
        isLoading={false}
      />,
    );
    expect(screen.getByText('▲ 8,5% vs enero')).toBeInTheDocument();
  });
});
