import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeChangeScope } from '@shared/incomeChangeScope';
import type { IncomeLine } from '@/types/income';

const { mockUpdate, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/hooks/useMonthlyIncome', () => ({
  useUpdateIncomeLine: () => ({ mutate: mockUpdate, isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import IncomeLineEditDialog from '@/components/income/IncomeLineEditDialog';

function line(overrides: Partial<IncomeLine> = {}): IncomeLine {
  return {
    id: 5,
    user_id: 1,
    label: 'Nómina',
    amount: 1600,
    start_month: '2026-01',
    end_month: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const onClose = vi.fn();

function renderDialog(target: IncomeLine, monthKey = '2026-06') {
  return render(
    <IncomeLineEditDialog
      line={target}
      monthKey={monthKey}
      isOpen
      onClose={onClose}
    />,
  );
}

async function setAmount(value: string) {
  const field = screen.getByLabelText('Importe');
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

beforeEach(() => {
  mockUpdate.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
  onClose.mockReset();
});

describe('IncomeLineEditDialog', () => {
  it('prefills the current name and amount', () => {
    renderDialog(line());

    expect(screen.getByLabelText('Nombre')).toHaveValue('Nómina');
    expect(screen.getByLabelText('Importe')).toHaveValue(1600);
  });

  it('hides the recurrence choice: an edit cannot turn a line into another kind', () => {
    renderDialog(line());

    expect(screen.queryByLabelText('Periodicidad')).not.toBeInTheDocument();
  });

  it('asks which months the change affects, naming the month in both options', () => {
    renderDialog(line(), '2026-06');

    expect(
      screen.getByText('Desde junio 2026 en adelante (una subida, un cambio definitivo)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Solo en junio 2026 (un mes excepcional)'),
    ).toBeInTheDocument();
  });

  it('defaults to the permanent change, which is what a raise needs', async () => {
    renderDialog(line(), '2026-06');

    await setAmount('2200');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        amount: 2200,
        month: '2026-06',
        scope: IncomeChangeScope.FromNowOn,
      }),
      expect.anything(),
    );
  });

  it('sends the this-month scope when that option is chosen', async () => {
    renderDialog(line(), '2026-06');

    await userEvent.click(
      screen.getByText('Solo en junio 2026 (un mes excepcional)'),
    );
    await setAmount('1900');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: IncomeChangeScope.ThisMonth }),
      expect.anything(),
    );
  });

  it('skips the question for a single-month line: no other month to apply to', async () => {
    renderDialog(line({ start_month: '2026-06', end_month: '2026-06', amount: 300 }));

    expect(screen.queryByText(/en adelante/)).not.toBeInTheDocument();
    expect(
      screen.getByText('Este ingreso solo aplica a junio 2026.'),
    ).toBeInTheDocument();

    await setAmount('450');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 450, scope: undefined }),
      expect.anything(),
    );
  });

  it('reports success and closes', async () => {
    mockUpdate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    renderDialog(line());

    await setAmount('2200');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('Ingreso actualizado');
    expect(onClose).toHaveBeenCalled();
  });

  it('translates a server error and keeps the dialog open', async () => {
    mockUpdate.mockImplementation((_vars, { onError }) =>
      onError(new Error('INCOME_LINE_NOT_IN_FORCE')),
    );
    renderDialog(line());

    await setAmount('2200');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(mockToastError).toHaveBeenCalledWith(
      'Ese ingreso no está vigente en el mes seleccionado',
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
