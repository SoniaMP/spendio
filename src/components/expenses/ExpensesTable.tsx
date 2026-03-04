import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from '@/components/ui/table';
import type { ExpenseWithCategory } from '@/types/expense';
import ExpenseRow from '@/components/expenses/ExpenseRow';

interface ExpensesTableProps {
  expenses: ExpenseWithCategory[];
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: (expense: ExpenseWithCategory) => void;
}

export default function ExpensesTable({
  expenses,
  onEdit,
  onDelete,
}: ExpensesTableProps) {
  return (
    <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead className="hidden sm:table-cell">Descripción</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead className="text-right">Importe</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
    </div>
  );
}
