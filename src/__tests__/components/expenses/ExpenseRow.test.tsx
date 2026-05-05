import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseRow from '@/components/expenses/ExpenseRow';
import type { ExpenseWithCategory } from '@/types/expense';

const expense: ExpenseWithCategory = {
  id: 1,
  amount: 50,
  description: 'lunch',
  date: '2026-03-15',
  category_id: 2,
  sheet_id: 1,
  created_at: '2026-03-15T00:00:00.000Z',
  updated_at: '2026-03-15T00:00:00.000Z',
  category_name: 'Food',
  category_color: '#ff0000',
};

function renderRow(props: Partial<React.ComponentProps<typeof ExpenseRow>>) {
  return render(
    <table>
      <tbody>
        <ExpenseRow expense={expense} {...props} />
      </tbody>
    </table>,
  );
}

describe('ExpenseRow', () => {
  it('hides the actions cell when readOnly', () => {
    renderRow({
      isReadOnly: true,
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    });
    expect(screen.queryByRole('button', { name: 'Acciones' })).toBeNull();
  });

  it('hides the actions cell when no callbacks are provided', () => {
    renderRow({});
    expect(screen.queryByRole('button', { name: 'Acciones' })).toBeNull();
  });

  it('shows kebab menu items in expected order', async () => {
    const user = userEvent.setup();
    renderRow({
      onEdit: vi.fn(),
      onDuplicate: vi.fn(),
      onMove: vi.fn(),
      onDelete: vi.fn(),
    });

    await user.click(screen.getByRole('button', { name: 'Acciones' }));

    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'Editar',
      'Duplicar',
      'Mover',
      'Eliminar',
    ]);
  });

  it('marks "Eliminar" as destructive', async () => {
    const user = userEvent.setup();
    renderRow({ onEdit: vi.fn(), onDelete: vi.fn() });

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    const eliminar = await screen.findByRole('menuitem', { name: 'Eliminar' });
    expect(eliminar).toHaveAttribute('data-variant', 'destructive');
  });

  it('triggers each callback with the expense when its item is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDuplicate = vi.fn();
    const onMove = vi.fn();
    const onDelete = vi.fn();
    renderRow({ onEdit, onDuplicate, onMove, onDelete });

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Mover' }));
    expect(onMove).toHaveBeenCalledWith(expense);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Duplicar' }));
    expect(onDuplicate).toHaveBeenCalledWith(expense);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledWith(expense);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledWith(expense);
  });
});
