import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import type { ExpenseWithCategory } from '@/types/expense';
import ExpenseForm from '@/components/expenses/ExpenseForm';

interface ExpenseFormDialogProps {
  sheetId: number;
  expense?: ExpenseWithCategory;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseFormDialog({
  sheetId,
  expense,
  isOpen,
  onClose,
}: ExpenseFormDialogProps) {
  const isEditing = !!expense;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: {
    amount: number;
    description: string;
    date: string;
    categoryId: number;
  }) {
    if (isEditing) {
      updateMutation.mutate(
        { id: expense.id, ...values },
        {
          onSuccess: () => {
            toast.success('Gasto actualizado');
            onClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        { ...values, sheetId },
        {
          onSuccess: () => {
            toast.success('Gasto creado');
            onClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar gasto' : 'Nuevo gasto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del gasto.'
              : 'Añade un nuevo gasto.'}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          initialValues={
            expense
              ? {
                  amount: expense.amount,
                  description: expense.description,
                  date: expense.date,
                  categoryId: expense.category_id,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
