import { useTranslation } from 'react-i18next';
import {
  Copy,
  MoreVertical,
  MoveRight,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableRow, TableCell } from '@/components/ui/table';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from '@/helpers/formatCurrency';
import { formatDate } from '@/helpers/formatDate';

interface ExpenseRowProps {
  expense: ExpenseWithCategory;
  onEdit?: (expense: ExpenseWithCategory) => void;
  onDuplicate?: (expense: ExpenseWithCategory) => void;
  onMove?: (expense: ExpenseWithCategory) => void;
  onDelete?: (expense: ExpenseWithCategory) => void;
  isReadOnly?: boolean;
}

export default function ExpenseRow({
  expense,
  onEdit,
  onDuplicate,
  onMove,
  onDelete,
  isReadOnly,
}: ExpenseRowProps) {
  const { t } = useTranslation();
  const hasAnyAction = !!(onEdit || onDuplicate || onMove || onDelete);

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {expense.recurring_id !== null && (
            <span title={t('expenses.recurringBadge')} className="inline-flex">
              <Repeat
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-label={t('expenses.recurringBadge')}
              />
            </span>
          )}
          {formatDate(expense.date)}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {expense.description || '—'}
      </TableCell>
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
      {!isReadOnly && hasAnyAction && (
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs" aria-label={t('common.actions')}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(expense)}>
                  <Pencil />
                  {t('common.edit')}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(expense)}>
                  <Copy />
                  {t('common.duplicate')}
                </DropdownMenuItem>
              )}
              {onMove && (
                <DropdownMenuItem onClick={() => onMove(expense)}>
                  <MoveRight />
                  {t('common.move')}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(expense)}
                  >
                    <Trash2 />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}
