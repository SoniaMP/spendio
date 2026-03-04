import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '@/components/expenses/ExpenseForm';

vi.mock('@/components/categories/CategoryCombobox', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: number | null;
    onChange: (id: number) => void;
  }) => (
    <button
      data-testid="category-combobox"
      data-value={value}
      onClick={() => onChange(1)}
    >
      {value ? `Category ${value}` : 'Select category'}
    </button>
  ),
}));

describe('ExpenseForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isPending: false,
  };

  it('renders all form fields', () => {
    render(<ExpenseForm {...defaultProps} />);

    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('shows initial values when editing', () => {
    render(
      <ExpenseForm
        {...defaultProps}
        initialValues={{
          amount: 42.5,
          description: 'Test expense',
          date: '2026-03-01',
          categoryId: 3,
        }}
      />,
    );

    expect(screen.getByLabelText('Importe')).toHaveValue(42.5);
    expect(screen.getByLabelText('Descripción')).toHaveValue('Test expense');
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-03-01');
    expect(screen.getByTestId('category-combobox')).toHaveAttribute(
      'data-value',
      '3',
    );
  });

  it('calls onSubmit with correct values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ExpenseForm {...defaultProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Importe'), '25.50');
    await user.type(screen.getByLabelText('Descripción'), 'Taxi');
    await user.clear(screen.getByLabelText('Fecha'));
    await user.type(screen.getByLabelText('Fecha'), '2026-03-15');
    await user.click(screen.getByTestId('category-combobox'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledWith({
      amount: 25.5,
      description: 'Taxi',
      date: '2026-03-15',
      categoryId: 1,
    });
  });

  it('disables submit when no category selected', () => {
    render(<ExpenseForm {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('shows "Guardando..." when isPending', () => {
    render(
      <ExpenseForm
        {...defaultProps}
        isPending
        initialValues={{
          amount: 10,
          description: '',
          date: '2026-03-01',
          categoryId: 1,
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });
});
