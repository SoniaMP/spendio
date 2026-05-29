import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
} from '@/hooks/useRecurringExpenses';
import RecurringExpenseForm, {
  type RecurringFormValues,
} from '@/components/recurring/RecurringExpenseForm';
import type { RecurringExpense } from '@/types/recurringExpense';

interface Props {
  sheetId: number;
  template?: RecurringExpense;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function RecurringExpenseFormDialog({
  sheetId,
  template,
  isOpen,
  onClose,
  onSaved,
}: Props) {
  const isEditing = !!template;
  const createMutation = useCreateRecurringExpense();
  const updateMutation = useUpdateRecurringExpense();
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSaved(message: string) {
    toast.success(message);
    onClose();
    onSaved?.();
  }

  function handleSubmit(values: RecurringFormValues) {
    if (isEditing) {
      updateMutation.mutate(
        { id: template.id, ...values },
        {
          onSuccess: () => handleSaved('Recurrente actualizado'),
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        { ...values, sheetId },
        {
          onSuccess: () => handleSaved('Recurrente creado'),
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
            {isEditing ? 'Editar recurrente' : 'Nuevo recurrente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Los cambios afectan solo a futuras generaciones.'
              : 'Automatiza un gasto que se repite.'}
          </DialogDescription>
        </DialogHeader>
        <RecurringExpenseForm
          initialValues={
            template
              ? {
                  amount: template.amount,
                  description: template.description,
                  categoryId: template.category_id ?? undefined,
                  period: template.period,
                  startDate: template.start_date,
                  endDate: template.end_date,
                  noticeDays: template.notice_days,
                }
              : undefined
          }
          isEditing={isEditing}
          isPending={isPending}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
