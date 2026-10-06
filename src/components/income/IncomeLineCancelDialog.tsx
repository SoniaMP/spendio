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
import { useCancelIncomeLine } from '@/hooks/useMonthlyIncome';
import { formatMonthKey } from '@/helpers/formatMonthKey';
import type { IncomeLine } from '@/types/income';
import { getErrorMessage } from '@/lib/errorMessage';

interface Props {
  line: IncomeLine | null;
  /** Month on screen; the line stops applying from here onwards. */
  monthKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomeLineCancelDialog({
  line,
  monthKey,
  isOpen,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const cancelMutation = useCancelIncomeLine();

  function handleConfirm() {
    if (!line) return;
    cancelMutation.mutate(
      { id: line.id, month: monthKey },
      {
        onSuccess: () => {
          toast.success(t('income.cancelled'));
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('income.cancel.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="income.cancel.confirm"
              values={{ label: line?.label ?? '', month: formatMonthKey(monthKey) }}
              components={{ name: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>
        {/* The guarantee worth stating out loud: closed months keep counting it. */}
        <p className="text-sm text-muted-foreground">{t('income.cancel.hint')}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? t('common.deleting') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
