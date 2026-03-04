import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from '@/helpers/formatCurrency';
import { formatDate } from '@/helpers/formatDate';

interface ExpenseRowProps {
  expense: ExpenseWithCategory;
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expense: ExpenseWithCategory) => void;
}

export default function ExpenseRow({
  expense,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {formatDate(expense.date)}
      </TableCell>
      <TableCell className="hidden sm:table-cell">{expense.description || '—'}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: expense.category_color }}
          />
          {expense.category_name}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(expense.amount)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(expense)}
            aria-label="Editar gasto"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(expense)}
            aria-label="Eliminar gasto"
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
