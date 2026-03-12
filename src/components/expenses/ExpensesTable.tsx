import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import type { ExpenseWithCategory } from '@/types/expense';
import ExpenseRow from '@/components/expenses/ExpenseRow';
import TablePagination from '@/components/ui/TablePagination';
import { usePagination } from '@/hooks/usePagination';

interface ExpensesTableProps {
  expenses: ExpenseWithCategory[];
  onEdit?: (expense: ExpenseWithCategory) => void;
  onDelete?: (expense: ExpenseWithCategory) => void;
}

export default function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  const pagination = usePagination({ totalItems: expenses.length });
  const visibleExpenses = expenses.slice(
    pagination.startIndex,
    pagination.endIndex,
  );

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden sm:table-cell">
                Descripción
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Importe</TableHead>
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
