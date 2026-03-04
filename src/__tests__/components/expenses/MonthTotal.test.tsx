import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthTotal from '@/components/expenses/MonthTotal';

describe('MonthTotal', () => {
  it('renders the label', () => {
    render(<MonthTotal total={0} />);
    expect(screen.getByText('Total del mes')).toBeInTheDocument();
  });

  it('renders the formatted amount', () => {
    render(<MonthTotal total={1250.5} />);
    expect(screen.getByText(/1250,50/)).toBeInTheDocument();
  });

  it('renders zero correctly', () => {
    render(<MonthTotal total={0} />);
    expect(screen.getByText(/0,00/)).toBeInTheDocument();
  });
});
