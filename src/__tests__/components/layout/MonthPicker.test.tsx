import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonthPicker from '@/components/layout/MonthPicker';

describe('MonthPicker', () => {
  const defaultProps = {
    label: 'marzo 2026',
    onPrevious: vi.fn(),
    onNext: vi.fn(),
  };

  it('renders the month label', () => {
    render(<MonthPicker {...defaultProps} />);
    expect(screen.getByText('marzo 2026')).toBeInTheDocument();
  });

  it('calls onPrevious when clicking left arrow', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    render(<MonthPicker {...defaultProps} onPrevious={onPrevious} />);

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(onPrevious).toHaveBeenCalledOnce();
  });

  it('calls onNext when clicking right arrow', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<MonthPicker {...defaultProps} onNext={onNext} />);

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
