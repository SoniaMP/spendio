import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SheetSummaryCard from '@/components/summary/SheetSummaryCard';
import type { SheetSummary } from '@/types/summary';

const sheet: SheetSummary = {
  sheetId: 1,
  sheetName: 'Personal',
  total: 200,
  categories: [
    { categoryId: 1, categoryName: 'Alimentación', categoryColor: '#EF4444', total: 120, count: 5 },
    { categoryId: 2, categoryName: 'Transporte', categoryColor: '#3B82F6', total: 80, count: 3 },
  ],
};

describe('SheetSummaryCard', () => {
  it('renders sheet name and total', () => {
    render(<SheetSummaryCard sheet={sheet} />);
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText(/200,00/)).toBeInTheDocument();
  });

  it('renders all categories', () => {
    render(<SheetSummaryCard sheet={sheet} />);
    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
    expect(screen.getByText(/120,00/)).toBeInTheDocument();
    expect(screen.getByText(/80,00/)).toBeInTheDocument();
  });
});
