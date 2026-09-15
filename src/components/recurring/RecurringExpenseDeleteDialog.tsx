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
import { toast } from 'sonner';
import { useDeleteRecurringExpense } from '@/hooks/useRecurringExpenses';
import type { RecurringExpense } from '@/types/recurringExpense';
import { getErrorMessage } from '@/lib/errorMessage';

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
  const { t } = useTranslation();
  const deleteMutation = useDeleteRecurringExpense();

  function handleConfirm() {
    if (!template) return;
    deleteMutation.mutate(template.id, {
      onSuccess: () => {
        toast.success(t('recurring.deleted'));
        onClose();
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('recurring.delete.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="recurring.delete.confirm"
              values={{ name: template?.description ?? '' }}
              components={{ name: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
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
