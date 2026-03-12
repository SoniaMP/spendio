import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TotalSummaryCard from '@/components/summary/TotalSummaryCard';
import type { CategoryTotal } from '@/types/summary';

const categories: CategoryTotal[] = [
  { categoryId: 1, categoryName: 'Alimentación', categoryColor: '#EF4444', total: 150, count: 8 },
  { categoryId: 2, categoryName: 'Transporte', categoryColor: '#3B82F6', total: 50, count: 3 },
];

describe('TotalSummaryCard', () => {
  it('renders total amount', () => {
    render(<TotalSummaryCard total={200} categories={categories} />);
    expect(screen.getByText(/200,00/)).toBeInTheDocument();
  });

  it('renders the "Total" title', () => {
    render(<TotalSummaryCard total={200} categories={categories} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders category breakdown', () => {
    render(<TotalSummaryCard total={200} categories={categories} />);
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });
});
