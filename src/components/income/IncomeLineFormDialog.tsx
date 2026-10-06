import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCreateIncomeLine } from '@/hooks/useMonthlyIncome';
import IncomeLineForm, {
  type IncomeLineFormValues,
} from '@/components/income/IncomeLineForm';
import { formatMonthKey } from '@/helpers/formatMonthKey';
import { getErrorMessage } from '@/lib/errorMessage';

interface Props {
  monthKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomeLineFormDialog({
  monthKey,
  isOpen,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const createMutation = useCreateIncomeLine();
  const monthLabel = formatMonthKey(monthKey);

  function handleSubmit(values: IncomeLineFormValues) {
    createMutation.mutate(
      { ...values, month: monthKey },
      {
        onSuccess: () => {
          toast.success(t('income.created'));
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
          <DialogTitle>{t('income.form.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('income.form.createDescription', { month: monthLabel })}
          </DialogDescription>
        </DialogHeader>
        {/* Remounted per opening so the fields never keep a previous draft. */}
        {isOpen && (
          <IncomeLineForm
            monthLabel={monthLabel}
            isPending={createMutation.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
