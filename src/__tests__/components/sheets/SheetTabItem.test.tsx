import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SheetTabItem from '@/components/sheets/SheetTabItem';

const mockSheet = {
  id: 1,
  name: 'General',
  position: 0,
  permission: 'owner' as const,
  shared_by_name: null,
  created_at: '',
  updated_at: '',
};

describe('SheetTabItem', () => {
  const defaultProps = {
    sheet: mockSheet,
    isActive: false,
    permission: 'owner' as const,
    onSelect: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders sheet name', () => {
    render(<SheetTabItem {...defaultProps} />);
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SheetTabItem {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByText('General'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('shows inline rename input on Renombrar click', async () => {
    const user = userEvent.setup();
    render(<SheetTabItem {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '' }));
    await user.click(await screen.findByText('Renombrar'));

    expect(screen.getByDisplayValue('General')).toBeInTheDocument();
  });
});
