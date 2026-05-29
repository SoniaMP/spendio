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
import { useDeleteRecurringExpense } from '@/hooks/useRecurringExpenses';
import type { RecurringExpense } from '@/types/recurringExpense';

interface Props {
  template: RecurringExpense | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RecurringExpenseDeleteDialog({
  template,
  isOpen,
  onClose,
}: Props) {
  const deleteMutation = useDeleteRecurringExpense();

  function handleConfirm() {
    if (!template) return;
    deleteMutation.mutate(template.id, {
      onSuccess: () => {
        toast.success('Recurrente eliminado');
        onClose();
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar recurrente</DialogTitle>
          <DialogDescription>
            ¿Seguro que quieres eliminar <strong>{template?.description}</strong>?
            Los gastos que ya se generaron seguirán existiendo.
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
