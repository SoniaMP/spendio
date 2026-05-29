import { useState } from 'react';
import { Plus, Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRecurringExpenses } from '@/hooks/useRecurringExpenses';
import RecurringExpenseRow from '@/components/recurring/RecurringExpenseRow';
import RecurringExpenseFormDialog from '@/components/recurring/RecurringExpenseFormDialog';
import RecurringExpenseDeleteDialog from '@/components/recurring/RecurringExpenseDeleteDialog';
import type { RecurringExpense } from '@/types/recurringExpense';

interface Props {
  sheetId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecurringExpensesDialog({ sheetId, isOpen, onClose }: Props) {
  const { data: templates, isLoading } = useRecurringExpenses(sheetId);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringExpense | undefined>();
  const [deletingTemplate, setDeletingTemplate] = useState<RecurringExpense | null>(null);

  function handleEdit(template: RecurringExpense) {
    setEditingTemplate(template);
    setIsFormOpen(true);
  }

  function handleNew() {
    setEditingTemplate(undefined);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingTemplate(undefined);
  }

  function renderBody() {
    if (isLoading) {
      return <p className="text-sm text-muted-foreground">Cargando...</p>;
    }
    if (!templates || templates.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
          <Repeat className="h-10 w-10" />
          <p className="font-medium text-foreground">Aún no tienes recurrentes</p>
          <p className="text-sm">
            Crea uno para automatizar gastos que se repiten (alquiler, suscripciones, etc.).
          </p>
          <Button onClick={handleNew}>
            <Plus /> Nueva
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {templates.map((t) => (
          <RecurringExpenseRow
            key={t.id}
            template={t}
            onEdit={handleEdit}
            onDelete={setDeletingTemplate}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gastos recurrentes</DialogTitle>
            <DialogDescription>
              Plantillas que generan un gasto automáticamente cada periodo.
            </DialogDescription>
          </DialogHeader>
          {renderBody()}
          {templates && templates.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleNew}>
                <Plus /> Nueva
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RecurringExpenseFormDialog
        sheetId={sheetId}
        template={editingTemplate}
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSaved={onClose}
      />

      <RecurringExpenseDeleteDialog
        template={deletingTemplate}
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
      />
    </>
  );
}
