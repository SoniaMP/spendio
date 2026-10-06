import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MonthlyIncome, IncomeLine } from '@/types/income';
import { formatCurrency } from '@/helpers/formatCurrency';

const { mockUseMonthlyIncome } = vi.hoisted(() => ({
  mockUseMonthlyIncome: vi.fn(),
}));
vi.mock('@/hooks/useMonthlyIncome', () => ({
  useMonthlyIncome: mockUseMonthlyIncome,
}));

import MonthlyIncomeChip from '@/components/income/MonthlyIncomeChip';

function line(overrides: Partial<IncomeLine> = {}): IncomeLine {
  return {
    id: 1,
    user_id: 1,
    label: 'Nómina',
    amount: 1600,
    start_month: '2026-10',
    end_month: null,
    created_at: '2026-10-01 00:00:00',
    updated_at: '2026-10-01 00:00:00',
    ...overrides,
  };
}

function mockIncome(
  data: Partial<MonthlyIncome> | null,
  state: { isLoading?: boolean; isError?: boolean } = {},
) {
  mockUseMonthlyIncome.mockReturnValue({
    data: data === null ? undefined : { amount: 0, spent: 0, remaining: 0, lines: [], ...data },
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  });
}

beforeEach(() => {
  mockUseMonthlyIncome.mockReset();
  onAddLine.mockReset();
  onManageLines.mockReset();
});

/**
 * `Intl.NumberFormat` puts a non-breaking space before the currency symbol, and
 * Testing Library normalizes the DOM text but not the expected string, so a
 * plain `getByText(formatCurrency(x))` never matches. Normalize both sides.
 */
function byCurrency(amount: number) {
  const expected = formatCurrency(amount).replace(/\s/g, ' ');
  return (content: string) => content.replace(/\s/g, ' ') === expected;
}

const onAddLine = vi.fn();
const onManageLines = vi.fn();

function renderChip() {
  return render(
    <MonthlyIncomeChip
      monthKey="2026-10"
      onAddLine={onAddLine}
      onManageLines={onManageLines}
    />,
  );
}

describe('MonthlyIncomeChip', () => {
  it('shows the figure and what is left', () => {
    mockIncome({ amount: 2000, spent: 1800, remaining: 200, lines: [line()] });

    renderChip();

    expect(screen.getByText(byCurrency(200))).toBeInTheDocument();
    expect(screen.getByText(byCurrency(2000))).toBeInTheDocument();
    // No words: the icon labels the box and the accessible name carries the rest.
    expect(screen.queryByText('Ingresos')).not.toBeInTheDocument();
    expect(screen.queryByText('quedan')).not.toBeInTheDocument();
  });

  it('marks a negative remaining as destructive', () => {
    mockIncome({ amount: 1000, spent: 1200, remaining: -200, lines: [line()] });

    renderChip();

    expect(screen.getByText(byCurrency(-200)).className).toContain(
      'text-destructive',
    );
  });

  it('does not mark a positive remaining as destructive', () => {
    mockIncome({ amount: 1000, spent: 200, remaining: 800, lines: [line()] });

    renderChip();

    expect(screen.getByText(byCurrency(800)).className).not.toContain(
      'text-destructive',
    );
  });

  it('explains that spent covers every sheet, unlike MonthTotal next to it', () => {
    mockIncome({ amount: 2000, spent: 1800, remaining: 200, lines: [line()] });

    renderChip();

    expect(screen.getByLabelText(/todas las hojas/i)).toBeInTheDocument();
  });

  it('renders nothing while loading, so the toolbar does not flash', () => {
    mockIncome(null, { isLoading: true });

    const { container } = renderChip();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on error — income must not break the expenses toolbar', () => {
    mockIncome(null, { isError: true });

    const { container } = renderChip();

    expect(container).toBeEmptyDOMElement();
  });

  it('collapses to a single add affordance when the month has no line', () => {
    mockIncome({ lines: [] });

    renderChip();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Ingresos');
  });

  it('exposes adding and managing as explicit labelled buttons', async () => {
    // Not a clickable box: nobody should have to discover that a figure is
    // secretly a link.
    const { default: userEvent } = await import('@testing-library/user-event');
    mockIncome({ amount: 2000, spent: 1800, remaining: 200, lines: [line()] });

    renderChip();
    await userEvent.click(screen.getByRole('button', { name: 'Añadir ingreso' }));
    await userEvent.click(screen.getByRole('button', { name: 'Gestionar ingresos' }));

    expect(onAddLine).toHaveBeenCalledOnce();
    expect(onManageLines).toHaveBeenCalledOnce();
  });

  it('does not nest the actions inside a clickable container', () => {
    mockIncome({ amount: 2000, spent: 1800, remaining: 200, lines: [line()] });

    renderChip();

    // Nested buttons are invalid HTML and break keyboard navigation.
    for (const button of screen.getAllByRole('button')) {
      expect(button.closest('button')).toBe(button);
    }
  });
});
