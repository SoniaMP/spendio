import { useMemo } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSheets } from '@/hooks/useSheets';
import { useExpensesByRange } from '@/hooks/useExpenses';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpensesTableSkeleton from '@/components/expenses/ExpensesTableSkeleton';
import { formatDate } from '@/helpers/formatDate';

export default function SheetDetailPage() {
  const { sheetId: sheetIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const sheetId = Number(sheetIdParam);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const categoryParam = searchParams.get('categoryId');
  const categoryId = categoryParam ? Number(categoryParam) : undefined;

  const { data: sheets } = useSheets();
  const { data: expenses, isLoading, isError } = useExpensesByRange(
    sheetId,
    from ?? '',
    to ?? '',
    categoryId,
  );

  const sheetName = useMemo(
    () => sheets?.find((s) => s.id === sheetId)?.name ?? 'Hoja',
    [sheets, sheetId],
  );
  const categoryName = categoryId
    ? expenses?.find((e) => e.category_id === categoryId)?.category_name
    : undefined;

  if (!Number.isFinite(sheetId) || !from || !to) {
    return <Navigate to="/summary" replace />;
  }

  function renderContent() {
    if (isLoading) return <ExpensesTableSkeleton />;

    if (isError) {
      return (
        <p className="text-destructive py-8 text-center">
          Error al cargar los gastos.
        </p>
      );
    }

    if (!expenses || expenses.length === 0) {
      return (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12">
          <Receipt className="h-10 w-10" />
          <p>No hay gastos en este periodo.</p>
        </div>
      );
    }

    return <ExpensesTable expenses={expenses} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to="/summary">
            <ArrowLeft /> Volver al resumen
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-bold">
            {sheetName}
            {categoryName && (
              <span className="text-muted-foreground font-normal">
                {' · '}
                {categoryName}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm">
            {formatDate(from)} – {formatDate(to)}
          </p>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
