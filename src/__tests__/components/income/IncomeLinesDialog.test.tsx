import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { IncomeLine, MonthlyIncome } from '@/types/income';

const { mockUseMonthlyIncome } = vi.hoisted(() => ({
  mockUseMonthlyIncome: vi.fn(),
}));
vi.mock('@/hooks/useMonthlyIncome', () => ({
  useMonthlyIncome: mockUseMonthlyIncome,
  useCancelIncomeLine: () => ({ mutate: vi.fn(), isPending: false }),
}));

import IncomeLinesDialog from '@/components/income/IncomeLinesDialog';

function line(id: number, label: string, amount: number, endMonth: string | null): IncomeLine {
  return {
    id,
    user_id: 1,
    label,
    amount,
    start_month: '2026-10',
    end_month: endMonth,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
  };
}

function mockIncome(data: Partial<MonthlyIncome>, isLoading = false) {
  mockUseMonthlyIncome.mockReturnValue({
    data: { amount: 0, spent: 0, remaining: 0, lines: [], ...data },
    isLoading,
    isError: false,
  });
}

const onAddLine = vi.fn();
const onEditLine = vi.fn();

function renderDialog() {
  return render(
    <IncomeLinesDialog
      monthKey="2026-10"
      isOpen
      onClose={vi.fn()}
      onAddLine={onAddLine}
      onEditLine={onEditLine}
    />,
  );
}

beforeEach(() => {
  mockUseMonthlyIncome.mockReset();
  onAddLine.mockReset();
  onEditLine.mockReset();
});

describe('IncomeLinesDialog', () => {
  it('lists the lines by amount descending, not by interval start', () => {
    // The SQL orders by start_month, which would put an older side income above
    // the salary. The breakdown convention in the app is amount descending.
    mockIncome({
      lines: [
        line(1, 'Freelance', 400, null),
        line(2, 'Nómina', 2200, null),
        line(3, 'Paga extra', 300, '2026-10'),
      ],
    });

    renderDialog();

    const labels = screen
      .getAllByText(/Freelance|Nómina|Paga extra/)
      .map((el) => el.textContent);
    expect(labels).toEqual(['Nómina', 'Freelance', 'Paga extra']);
  });

  it('derives the line type badge from the interval', () => {
    mockIncome({
      lines: [
        line(1, 'Nómina', 2200, null),
        line(2, 'Paga extra', 300, '2026-10'),
        line(3, 'Alquiler', 500, '2026-12'),
      ],
    });

    renderDialog();

    expect(screen.getByText('Recurrente')).toBeInTheDocument();
    expect(screen.getByText('Solo este mes')).toBeInTheDocument();
    expect(screen.getByText(/Hasta diciembre 2026/i)).toBeInTheDocument();
  });

  it('breaks the figure down in the footer, labelling the spent scope', () => {
    mockIncome({
      amount: 2000,
      spent: 1800,
      remaining: 200,
      lines: [line(1, 'Nómina', 2000, null)],
    });

    renderDialog();

    expect(screen.getByText('Gastado (todas las hojas)')).toBeInTheDocument();
  });

  it('offers a way in when the month has no line', () => {
    mockIncome({ lines: [] });

    renderDialog();

    expect(screen.getByText('Sin ingresos este mes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nueva/i })).toBeInTheDocument();
  });

  it('shows a loading state instead of the empty state while fetching', () => {
    mockIncome({ lines: [] }, true);

    renderDialog();

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('Sin ingresos este mes')).not.toBeInTheDocument();
  });

  it('exposes edit and cancel actions naming the line, for screen readers', () => {
    mockIncome({ lines: [line(1, 'Nómina', 2000, null)] });

    renderDialog();

    expect(
      screen.getByRole('button', { name: 'Editar Nómina' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar Nómina' }),
    ).toBeInTheDocument();
  });

  it('hands the line up to be edited', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const salary = line(1, 'Nómina', 2000, null);
    mockIncome({ lines: [salary] });

    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Editar Nómina' }));

    expect(onEditLine).toHaveBeenCalledWith(salary);
  });
});
