import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartLegend from '@/components/expenses/ChartLegend';
import type { CategoryBreakdown } from '@/types/chartData';

describe('ChartLegend', () => {
  const items: CategoryBreakdown[] = [
    { categoryName: 'Alimentación', color: '#EF4444', amount: 150, percentage: 60 },
    { categoryName: 'Transporte', color: '#3B82F6', amount: 100, percentage: 40 },
  ];

  it('renders all items with correct names and amounts', () => {
    render(<ChartLegend items={items} />);

    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText(/150,00/)).toBeInTheDocument();
    expect(screen.getByText(/100,00/)).toBeInTheDocument();
  });

  it('renders percentages', () => {
    render(<ChartLegend items={items} />);

    expect(screen.getByText(/60\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/40\.0%/)).toBeInTheDocument();
  });

  it('renders color dots with correct colors', () => {
    render(<ChartLegend items={items} />);

    const dots = document.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(2);
    expect((dots[0] as HTMLElement).style.backgroundColor).toBe(
      'rgb(239, 68, 68)',
    );
    expect((dots[1] as HTMLElement).style.backgroundColor).toBe(
      'rgb(59, 130, 246)',
    );
  });
});
