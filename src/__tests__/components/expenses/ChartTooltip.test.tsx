import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartTooltip from '@/components/expenses/ChartTooltip';

describe('ChartTooltip', () => {
  const payload = [
    {
      payload: {
        categoryName: 'Alimentación',
        amount: 150.5,
        percentage: 60.2,
      },
    },
  ];

  it('renders name, amount, and percentage when active', () => {
    render(<ChartTooltip active payload={payload} />);

    expect(screen.getByText('Alimentación')).toBeInTheDocument();
    expect(screen.getByText(/150,50/)).toBeInTheDocument();
    expect(screen.getByText(/60\.2%/)).toBeInTheDocument();
  });

  it('returns null when inactive', () => {
    const { container } = render(
      <ChartTooltip active={false} payload={payload} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('returns null when payload is empty', () => {
    const { container } = render(<ChartTooltip active payload={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
