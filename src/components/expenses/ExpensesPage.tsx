import { useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import type { ExpenseWithCategory } from '@/types/expense';
import MonthPicker from '@/components/layout/MonthPicker';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpensesTableSkeleton from '@/components/expenses/ExpensesTableSkeleton';
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDeleteDialog from '@/components/expenses/ExpenseDeleteDialog';
import ExportButton from '@/components/expenses/ExportButton';
import ExpenseChart from '@/components/expenses/ExpenseChart';

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

  function renderContent() {
    if (isLoading) return <ExpensesTableSkeleton />;

    if (isError) {
      return (
        <p className="py-8 text-center text-destructive">
          Error al cargar los gastos.
        </p>
      );
    }

    if (!expenses || expenses.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Receipt className="h-10 w-10" />
          <p>No hay gastos en este mes.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus /> Añadir gasto
          </Button>
        </div>
      );
    }

    return (
      <ExpensesTable
        expenses={expenses}
        onEdit={handleEdit}
        onDelete={setDeletingExpense}
      />
    );
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr,320px]">
        <div className="order-2 md:order-1">{renderContent()}</div>
        {expenses && expenses.length > 0 && (
          <div className="order-1 md:order-2">
            <ExpenseChart expenses={expenses} />
          </div>
        )}
      </div>

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
