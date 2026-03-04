import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import type { ExpenseWithCategory } from '@/types/expense';
import MonthPicker from '@/components/layout/MonthPicker';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDeleteDialog from '@/components/expenses/ExpenseDeleteDialog';
import ExportButton from '@/components/expenses/ExportButton';

export default function ExpensesPage() {
  const { monthKey, monthLabel, goToPreviousMonth, goToNextMonth } =
    useMonthFilter();
  const { data: expenses, isLoading, isError } = useExpenses(monthKey);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    ExpenseWithCategory | undefined
  >();
  const [deletingExpense, setDeletingExpense] =
    useState<ExpenseWithCategory | null>(null);

  function handleEdit(expense: ExpenseWithCategory) {
    setEditingExpense(expense);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingExpense(undefined);
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Cargando gastos...</p>;
  }

  if (isError) {
    return <p className="text-destructive">Error al cargar los gastos.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <MonthPicker
          label={monthLabel}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
        />
        <div className="flex items-center gap-2">
          <ExportButton expenses={expenses ?? []} monthLabel={monthLabel} />
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus /> Nuevo gasto
          </Button>
        </div>
      </div>

      {expenses && expenses.length > 0 ? (
        <ExpensesTable
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={setDeletingExpense}
        />
      ) : (
        <p className="text-muted-foreground">No hay gastos en este mes.</p>
      )}

      <ExpenseFormDialog
        expense={editingExpense}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
      />

      <ExpenseDeleteDialog
        expense={deletingExpense}
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
      />
    </div>
  );
}
