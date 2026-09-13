import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
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
  const { t } = useTranslation();
  const isEditing = !!expense;
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const isPending = createMutation.isPending || updateMutation.isPending;
  const { data: currentUser } = useAuth();
  const canChooseScope =
    isEditing && expense?.recurring_id != null && expense.user_id === currentUser?.id;
  const [scope, setScope] = useState<'this' | 'future'>('this');

  function handleClose() {
    setScope('this');
    onClose();
  }

  function handleSubmit(values: {
    amount: number;
    description: string;
    date: string;
    categoryId: number;
  }) {
    if (isEditing) {
      updateMutation.mutate(
        { id: expense.id, scope: canChooseScope ? scope : undefined, ...values },
        {
          onSuccess: () => {
            toast.success(t('expenses.updated'));
            handleClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(
        { ...values, sheetId },
        {
          onSuccess: () => {
            toast.success(t('expenses.created'));
            handleClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('expenses.form.editTitle') : t('expenses.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('expenses.form.editDescription')
              : t('expenses.form.createDescription')}
          </DialogDescription>
        </DialogHeader>
        {canChooseScope && (
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="edit-scope"
                checked={scope === 'this'}
                onChange={() => setScope('this')}
                className="mt-1"
              />
              <Label className="cursor-pointer">{t('expenses.form.scopeThis')}</Label>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="edit-scope"
                checked={scope === 'future'}
                onChange={() => setScope('future')}
                className="mt-1"
              />
              <Label className="cursor-pointer">
                {t('expenses.form.scopeFuture')}
              </Label>
            </label>
          </div>
        )}
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
