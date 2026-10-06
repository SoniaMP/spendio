import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IncomeLine } from '@/types/income';

const { mockCancel, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockCancel: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/hooks/useMonthlyIncome', () => ({
  useCancelIncomeLine: () => ({ mutate: mockCancel, isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import IncomeLineCancelDialog from '@/components/income/IncomeLineCancelDialog';

const line: IncomeLine = {
  id: 7,
  user_id: 1,
  label: 'Nómina',
  amount: 2000,
  start_month: '2026-01',
  end_month: null,
  created_at: '',
  updated_at: '',
};

const onClose = vi.fn();

function renderDialog(monthKey = '2026-07') {
  return render(
    <IncomeLineCancelDialog
      line={line}
      monthKey={monthKey}
      isOpen
      onClose={onClose}
    />,
  );
}

beforeEach(() => {
  mockCancel.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
  onClose.mockReset();
});

describe('IncomeLineCancelDialog', () => {
  it('names the line and the month the cancellation starts from', () => {
    renderDialog();

    expect(screen.getByText('Nómina')).toBeInTheDocument();
    expect(screen.getByText(/julio 2026/)).toBeInTheDocument();
  });

  it('promises that earlier months keep counting the line', () => {
    renderDialog();

    expect(screen.getByText(/no se altera el historial/i)).toBeInTheDocument();
  });

  it('cancels from the month on screen, not from the line start', async () => {
    // The whole point of UC-INC-05: the server closes the interval at the month
    // before the one being viewed, so passing start_month here would wipe out
    // six months of history.
    renderDialog('2026-07');

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mockCancel).toHaveBeenCalledWith(
      { id: 7, month: '2026-07' },
      expect.anything(),
    );
  });

  it('reports success and closes', async () => {
    mockCancel.mockImplementation((_vars, { onSuccess }) => onSuccess());
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mockToastSuccess).toHaveBeenCalledWith('Ingreso cancelado');
    expect(onClose).toHaveBeenCalled();
  });

  it('surfaces a server error and keeps the dialog open', async () => {
    mockCancel.mockImplementation((_vars, { onError }) =>
      onError(new Error('INCOME_LINE_NOT_FOUND')),
    );
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mockToastError).toHaveBeenCalledWith('Línea de ingreso no encontrada');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes without cancelling anything on Cancelar', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(mockCancel).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
