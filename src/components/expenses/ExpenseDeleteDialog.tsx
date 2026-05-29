import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDeleteExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from '@/helpers/formatCurrency';

interface Props {
  expense: ExpenseWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDeleteDialog({ expense, isOpen, onClose }: Props) {
  const deleteMutation = useDeleteExpense();
  const { data: currentUser } = useAuth();
  const [scope, setScope] = useState<'this' | 'future'>('this');

  const canChooseScope =
    expense?.recurring_id != null && expense.user_id === currentUser?.id;

  function handleClose() {
    setScope('this');
    onClose();
  }

  function handleConfirm() {
    if (!expense) return;
    deleteMutation.mutate(
      { id: expense.id, scope: canChooseScope ? scope : undefined },
      {
        onSuccess: () => {
          toast.success(
            scope === 'future' && canChooseScope
              ? 'Gastos eliminados'
              : 'Gasto eliminado',
          );
          handleClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar gasto</DialogTitle>
          <DialogDescription>
            {canChooseScope ? (
              <>Este gasto forma parte de una serie recurrente. ¿Qué quieres eliminar?</>
            ) : (
              <>
                ¿Seguro que quieres eliminar este gasto de{' '}
                <strong>{expense ? formatCurrency(expense.amount) : ''}</strong>?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {canChooseScope && (
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'this'}
                onChange={() => setScope('this')}
                className="mt-1"
              />
              <div>
                <Label className="cursor-pointer">Solo este gasto</Label>
                <p className="text-sm text-muted-foreground">
                  Los demás gastos de la serie no se tocan.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                checked={scope === 'future'}
                onChange={() => setScope('future')}
                className="mt-1"
              />
              <div>
                <Label className="cursor-pointer">Este gasto y los siguientes</Label>
                <p className="text-sm text-muted-foreground">
                  Elimina este, los futuros, y la plantilla. Los pasados se conservan.
                </p>
              </div>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
