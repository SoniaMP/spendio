import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SheetCreateDialog from '@/components/sheets/SheetCreateDialog';

describe('SheetCreateDialog', () => {
  const defaultProps = {
    isOpen: true,
    isPending: false,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  it('renders dialog with name input', () => {
    render(<SheetCreateDialog {...defaultProps} />);
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('disables submit when name is empty', () => {
    render(<SheetCreateDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled();
  });

  it('calls onSubmit with trimmed name', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SheetCreateDialog {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre'), '  Mi hoja  ');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(onSubmit).toHaveBeenCalledWith('Mi hoja');
  });

  it('shows "Creando..." when isPending', () => {
    render(<SheetCreateDialog {...defaultProps} isPending />);
    expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled();
  });
});
