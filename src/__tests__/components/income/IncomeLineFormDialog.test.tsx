import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockCreate, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('@/hooks/useMonthlyIncome', () => ({
  useCreateIncomeLine: () => ({ mutate: mockCreate, isPending: false }),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

import IncomeLineFormDialog from '@/components/income/IncomeLineFormDialog';

const onClose = vi.fn();

function renderDialog(monthKey = '2026-10') {
  return render(
    <IncomeLineFormDialog monthKey={monthKey} isOpen onClose={onClose} />,
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Nómina');
  await userEvent.type(screen.getByLabelText('Importe'), '2000');
  await userEvent.click(screen.getByRole('button', { name: 'Crear' }));
}

beforeEach(() => {
  mockCreate.mockReset();
  mockToastSuccess.mockReset();
  mockToastError.mockReset();
  onClose.mockReset();
});

describe('IncomeLineFormDialog', () => {
  it('names the month the line will start in', () => {
    renderDialog('2026-10');

    expect(
      screen.getByText('Se añadirá a partir de octubre 2026.'),
    ).toBeInTheDocument();
    // The month is also named inside each recurrence option, so the choice is
    // unambiguous without reading the description.
    expect(screen.getAllByText(/octubre 2026/).length).toBeGreaterThan(1);
  });

  it('creates the line for the month on screen', async () => {
    renderDialog('2026-10');

    await fillAndSubmit();

    expect(mockCreate).toHaveBeenCalledWith(
      { label: 'Nómina', amount: 2000, isRecurring: true, month: '2026-10' },
      expect.anything(),
    );
  });

  it('reports success and closes', async () => {
    mockCreate.mockImplementation((_vars, { onSuccess }) => onSuccess());
    renderDialog();

    await fillAndSubmit();

    expect(mockToastSuccess).toHaveBeenCalledWith('Ingreso añadido');
    expect(onClose).toHaveBeenCalled();
  });

  it('translates a server error and keeps the dialog open', async () => {
    mockCreate.mockImplementation((_vars, { onError }) =>
      onError(new Error('INCOME_LABEL_REQUIRED')),
    );
    renderDialog();

    await fillAndSubmit();

    expect(mockToastError).toHaveBeenCalledWith(
      'El nombre del ingreso es obligatorio',
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
