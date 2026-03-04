import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useDeleteExpense } from '@/hooks/useExpenses';
import type { ExpenseWithCategory } from '@/types/expense';
import { formatCurrency } from '@/helpers/formatCurrency';

interface ExpenseDeleteDialogProps {
  expense: ExpenseWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDeleteDialog({
  expense,
  isOpen,
  onClose,
}: ExpenseDeleteDialogProps) {
  const deleteMutation = useDeleteExpense();

  function handleConfirm() {
    if (!expense) return;
    deleteMutation.mutate(expense.id, {
      onSuccess: () => {
        toast.success('Gasto eliminado');
        onClose();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar gasto</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar este gasto de{' '}
            <strong>{expense ? formatCurrency(expense.amount) : ''}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
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
