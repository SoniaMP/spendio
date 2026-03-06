import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SheetDeleteDialog from '@/components/sheets/SheetDeleteDialog';

const mockSheet = {
  id: 1,
  name: 'General',
  position: 0,
  created_at: '',
  updated_at: '',
};

describe('SheetDeleteDialog', () => {
  const defaultProps = {
    sheet: mockSheet,
    isOpen: true,
    isPending: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders warning with sheet name', () => {
    render(<SheetDeleteDialog {...defaultProps} />);
    expect(screen.getByText(/General/)).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/)).toBeInTheDocument();
  });

  it('calls onConfirm when clicking Eliminar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<SheetDeleteDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onClose when clicking Cancelar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SheetDeleteDialog {...defaultProps} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "Eliminando..." when isPending', () => {
    render(<SheetDeleteDialog {...defaultProps} isPending />);
    expect(
      screen.getByRole('button', { name: 'Eliminando...' }),
    ).toBeDisabled();
  });
});
