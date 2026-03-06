import { useState, useMemo } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useCategoryComparison } from '@/hooks/useCategoryComparison';
import { calcMonthTotal } from '@/helpers/calcMonthTotal';
import { groupExpensesByCategory } from '@/helpers/groupExpensesByCategory';
import type { ExpenseWithCategory } from '@/types/expense';
import MonthPicker from '@/components/layout/MonthPicker';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpensesTableSkeleton from '@/components/expenses/ExpensesTableSkeleton';
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog';
import ExpenseDeleteDialog from '@/components/expenses/ExpenseDeleteDialog';
import ExportButton from '@/components/expenses/ExportButton';
import ExpenseChart from '@/components/expenses/ExpenseChart';
import MonthlySummary from '@/components/expenses/MonthlySummary';
import CategoryFilter from '@/components/expenses/CategoryFilter';

export default function ExpensesPage() {
  const {
    year,
    month,
    monthKey,
    monthLabel,
    previousMonthKey,
    goToPreviousMonth,
    goToNextMonth,
  } = useMonthFilter();

  const { data: expenses, isLoading, isError } = useExpenses(monthKey);
  const { data: previousExpenses, isLoading: isPreviousLoading } =
    useExpenses(previousMonthKey);

  const {
    comparisonMonthKey,
    comparisonBreakdown,
    comparisonMonthOptions,
    isComparisonLoading: isComparisonBreakdownLoading,
    handleComparisonMonthChange,
  } = useCategoryComparison({
    year,
    month,
    monthKey,
    previousMonthKey,
    previousExpenses,
    isPreviousLoading,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<
    ExpenseWithCategory | undefined
  >();
  const [deletingExpense, setDeletingExpense] =
    useState<ExpenseWithCategory | null>(null);
  const [filterState, setFilterState] = useState<{
    monthKey: string;
    categoryId: number | null;
  }>({ monthKey, categoryId: null });

  const filterCategoryId =
    filterState.monthKey === monthKey ? filterState.categoryId : null;

  function handleFilterChange(categoryId: number | null) {
    setFilterState({ monthKey, categoryId });
  }

  const currentTotal = useMemo(
    () => calcMonthTotal(expenses ?? []),
    [expenses],
  );
  const categoryBreakdown = useMemo(
    () => groupExpensesByCategory(expenses ?? []),
    [expenses],
  );
  const filteredExpenses = useMemo(
    () =>
      filterCategoryId === null
        ? (expenses ?? [])
        : (expenses ?? []).filter(
            (e) => e.category_id === filterCategoryId,
          ),
    [expenses, filterCategoryId],
  );

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
        expenses={filteredExpenses}
        onEdit={handleEdit}
        onDelete={setDeletingExpense}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MonthPicker
          label={monthLabel}
          onPrevious={goToPreviousMonth}
          onNext={goToNextMonth}
        />
        <div className="flex items-center gap-2">
          <CategoryFilter
            value={filterCategoryId}
            onChange={handleFilterChange}
          />
          <ExportButton expenses={expenses ?? []} monthLabel={monthLabel} />
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus /> <span className="hidden sm:inline">Nuevo gasto</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr,320px] xl:grid-cols-[1fr,380px]">
        <div className="order-2 lg:order-1">{renderContent()}</div>
        {expenses && expenses.length > 0 && (
          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <ExpenseChart expenses={filteredExpenses} />
            <MonthlySummary
              currentTotal={currentTotal}
              currentBreakdown={categoryBreakdown}
              comparisonBreakdown={comparisonBreakdown}
              comparisonMonthKey={comparisonMonthKey}
              monthOptions={comparisonMonthOptions}
              isComparisonLoading={isComparisonBreakdownLoading}
              onComparisonMonthChange={handleComparisonMonthChange}
            />
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
