import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExpenseWithCategory } from '@/types/expense';

/**
 * Both scope pickers put a shadcn `Label` — which renders a `<label>` of its own
 * — inside an outer `<label>`. Nested labels are invalid HTML and the inner one
 * has no labelable descendant, so clicking the text never reaches the radio and
 * only the small circle is clickable. These tests click the *text*, which is
 * what a user aims at.
 */
const { mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/hooks/useExpenses', () => ({
  useCreateExpense: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateExpense: () => ({ mutate: mockUpdate, isPending: false }),
  useDeleteExpense: () => ({ mutate: mockDelete, isPending: false }),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ data: { id: 1 } }),
}));
vi.mock('@/components/categories/CategoryCombobox', () => ({
  default: ({ onChange }: { onChange: (id: number) => void }) => (
    <button onClick={() => onChange(1)}>combobox</button>
  ),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDeleteDialog from '@/components/expenses/ExpenseDeleteDialog';

const recurringExpense: ExpenseWithCategory = {
  id: 10,
  amount: 50,
  description: 'Gimnasio',
  date: '2026-10-04',
  category_id: 1,
  sheet_id: 1,
  user_id: 1,
  recurring_id: 3,
  created_at: '',
  updated_at: '',
  category_name: 'Ocio',
  category_color: '#3B82F6',
};

beforeEach(() => {
  mockUpdate.mockReset();
  mockDelete.mockReset();
});

describe('ExpenseFormDialog scope picker', () => {
  it('selects the future scope when its label text is clicked', async () => {
    render(
      <ExpenseFormDialog
        sheetId={1}
        expense={recurringExpense}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByText(
        'Este y los siguientes (importe, descripción, categoría)',
      ),
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toBeChecked();
  });
});

describe('ExpenseDeleteDialog scope picker', () => {
  it('selects the future scope when its label text is clicked', async () => {
    render(
      <ExpenseDeleteDialog
        expense={recurringExpense}
        isOpen
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByText('Este gasto y los siguientes'));

    const radios = screen.getAllByRole('radio');
    expect(radios[1]).toBeChecked();
  });
});
