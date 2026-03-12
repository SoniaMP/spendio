import { useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import SortableTableHead from '@/components/ui/SortableTableHead';
import type { ExpenseWithCategory } from '@/types/expense';
import ExpenseRow from '@/components/expenses/ExpenseRow';
import TablePagination from '@/components/ui/TablePagination';
import { usePagination } from '@/hooks/usePagination';
import { useSort } from '@/hooks/useSort';

type ExpenseSortKey = 'date' | 'description' | 'category' | 'amount';

interface ExpensesTableProps {
  expenses: ExpenseWithCategory[];
  onEdit?: (expense: ExpenseWithCategory) => void;
  onDelete?: (expense: ExpenseWithCategory) => void;
}

const SORT_ACCESSORS: Record<ExpenseSortKey, (e: ExpenseWithCategory) => string | number> = {
  date: (e) => e.date,
  description: (e) => e.description.toLowerCase(),
  category: (e) => e.category_name.toLowerCase(),
  amount: (e) => e.amount,
};

export default function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const accessors = useMemo(() => SORT_ACCESSORS, []);
  const { sortedItems, sortColumn, sortDirection, toggleSort } = useSort(expenses, accessors);
  const pagination = usePagination({ totalItems: sortedItems.length });
  const visibleExpenses = sortedItems.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                isActive={sortColumn === 'date'}
                direction={sortDirection}
                onToggle={() => toggleSort('date')}
              >
                Fecha
              </SortableTableHead>
              <SortableTableHead
                className="hidden sm:table-cell"
                isActive={sortColumn === 'description'}
                direction={sortDirection}
                onToggle={() => toggleSort('description')}
              >
                Descripción
              </SortableTableHead>
              <SortableTableHead
                isActive={sortColumn === 'category'}
                direction={sortDirection}
                onToggle={() => toggleSort('category')}
              >
                Categoría
              </SortableTableHead>
              <SortableTableHead
                className="text-right"
                isActive={sortColumn === 'amount'}
                direction={sortDirection}
                onToggle={() => toggleSort('amount')}
              >
                Importe
              </SortableTableHead>
              {(onEdit || onDelete) && (
                <TableHead className="text-right">Acciones</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleExpenses.map((expense) => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
                isReadOnly={!onEdit && !onDelete}
              />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          canGoPrevious={pagination.canGoPrevious}
          canGoNext={pagination.canGoNext}
          canGoFirst={pagination.canGoFirst}
          canGoLast={pagination.canGoLast}
          onFirst={pagination.goFirst}
          onLast={pagination.goLast}
          onPrevious={pagination.goPrevious}
          onNext={pagination.goNext}
          onPageSizeChange={pagination.changePageSize}
        />
      </CardContent>
    </Card>
  );
}
