import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryForm from '@/components/categories/CategoryForm';

describe('CategoryForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isPending: false,
  };

  it('renders name and color fields', () => {
    render(<CategoryForm {...defaultProps} />);

    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('shows initial values when editing', () => {
    render(
      <CategoryForm
        {...defaultProps}
        initialValues={{ name: 'Transporte', color: '#EF4444' }}
      />,
    );

    expect(screen.getByLabelText('Nombre')).toHaveValue('Transporte');
    expect(screen.getByLabelText('Color')).toHaveValue('#ef4444');
  });

  it('calls onSubmit with trimmed name on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre'), '  Ocio  ');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ocio',
      color: '#6B7280',
    });
  });

  it('disables submit button when name is empty', () => {
    render(<CategoryForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('disables submit button when isPending', async () => {
    render(
      <CategoryForm
        {...defaultProps}
        isPending
        initialValues={{ name: 'Test', color: '#000000' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });

  it('shows "Guardando..." text when isPending', () => {
    render(
      <CategoryForm
        {...defaultProps}
        isPending
        initialValues={{ name: 'Test', color: '#000000' }}
      />,
    );

    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('does not submit with only whitespace', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre'), '   ');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
