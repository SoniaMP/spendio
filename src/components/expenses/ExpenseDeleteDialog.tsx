import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
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
import { getErrorMessage } from '@/lib/errorMessage';

interface Props {
  expense: ExpenseWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExpenseDeleteDialog({ expense, isOpen, onClose }: Props) {
  const { t } = useTranslation();
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
              ? t('expenses.deletedMany')
              : t('expenses.deletedOne'),
          );
          handleClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('expenses.delete.title')}</DialogTitle>
          <DialogDescription>
            {canChooseScope ? (
              <>{t('expenses.delete.recurringQuestion')}</>
            ) : (
              <Trans
                i18nKey="expenses.delete.confirm"
                values={{ amount: expense ? formatCurrency(expense.amount) : '' }}
                components={{ amount: <strong /> }}
              />
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
                <Label className="cursor-pointer">{t('expenses.delete.scopeThis')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('expenses.delete.scopeThisHint')}
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
                <Label className="cursor-pointer">{t('expenses.delete.scopeFuture')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('expenses.delete.scopeFutureHint')}
                </p>
              </div>
            </label>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
