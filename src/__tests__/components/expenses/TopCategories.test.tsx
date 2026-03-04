import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopCategories from '@/components/expenses/TopCategories';
import type { CategoryBreakdown } from '@/types/chartData';

const mockCategories: CategoryBreakdown[] = [
  { categoryName: 'Comida', color: '#ff0000', amount: 450, percentage: 45 },
  { categoryName: 'Transporte', color: '#00ff00', amount: 200, percentage: 20 },
  { categoryName: 'Ocio', color: '#0000ff', amount: 150, percentage: 15 },
  { categoryName: 'Salud', color: '#ff00ff', amount: 100, percentage: 10 },
];

describe('TopCategories', () => {
  it('renders empty state when no categories', () => {
    render(<TopCategories categories={[]} />);
    expect(screen.getByText('Sin categorías')).toBeInTheDocument();
  });

  it('renders only the top 3 categories', () => {
    render(<TopCategories categories={mockCategories} />);
    expect(screen.getByText(/Comida/)).toBeInTheDocument();
    expect(screen.getByText(/Transporte/)).toBeInTheDocument();
    expect(screen.getByText(/Ocio/)).toBeInTheDocument();
    expect(screen.queryByText(/Salud/)).not.toBeInTheDocument();
  });

  it('renders formatted amounts', () => {
    render(<TopCategories categories={mockCategories} />);
    expect(screen.getByText(/450,00/)).toBeInTheDocument();
    expect(screen.getByText(/200,00/)).toBeInTheDocument();
  });

  it('renders color dots with correct background', () => {
    render(<TopCategories categories={mockCategories.slice(0, 1)} />);
    const dot = document.querySelector('span[style]');
    expect(dot).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});
