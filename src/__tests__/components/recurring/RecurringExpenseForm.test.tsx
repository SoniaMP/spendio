import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecurringExpenseForm from '@/components/recurring/RecurringExpenseForm';

vi.mock('@/components/categories/CategoryCombobox', () => ({
  default: ({
    value,
    onChange,
  }: {
    value: number | null;
    onChange: (v: number | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(1)} aria-label="cat">
      {value ?? 'none'}
    </button>
  ),
}));

describe('RecurringExpenseForm', () => {
  const baseProps = {
    isEditing: false,
    isPending: false,
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(<RecurringExpenseForm {...baseProps} />);
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de inicio')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Avisarme con X días de antelación'),
    ).toBeInTheDocument();
  });

  it('keeps submit disabled until amount and category are valid', () => {
    render(<RecurringExpenseForm {...baseProps} />);
    const submit = screen.getByRole('button', { name: 'Guardar' });
    expect(submit).toBeDisabled();
  });

  it('calls onSubmit with parsed values when all required are set', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RecurringExpenseForm {...baseProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Importe'), '50');
    await user.type(screen.getByLabelText('Descripción'), 'Alquiler');
    await user.click(screen.getByLabelText('cat'));

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      amount: 50,
      description: 'Alquiler',
      categoryId: 1,
      period: 'monthly',
      noticeDays: 3,
    });
  });

  it('preserves past start_date when editing', () => {
    render(
      <RecurringExpenseForm
        {...baseProps}
        isEditing
        initialValues={{
          amount: 10,
          description: 'X',
          categoryId: 1,
          period: 'monthly',
          startDate: '2020-01-01',
          noticeDays: 0,
        }}
      />,
    );
    const submit = screen.getByRole('button', { name: 'Guardar' });
    expect(submit).not.toBeDisabled();
  });
});
