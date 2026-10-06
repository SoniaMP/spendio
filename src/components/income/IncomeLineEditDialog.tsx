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
import { useUpdateIncomeLine } from '@/hooks/useMonthlyIncome';
import IncomeLineForm, {
  type IncomeLineFormValues,
} from '@/components/income/IncomeLineForm';
import { formatMonthKey } from '@/helpers/formatMonthKey';
import { IncomeChangeScope } from '@shared/incomeChangeScope';
import type { IncomeLine } from '@/types/income';
import { getErrorMessage } from '@/lib/errorMessage';

interface Props {
  line: IncomeLine | null;
  /** Month on screen; the change is applied relative to it. */
  monthKey: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Edits a line's name and amount. When the amount can mean two different things
 * the dialog asks which — the same "this one / this and the following ones"
 * choice the recurring expense form already offers, kept inline rather than in a
 * second dialog so the answer is visible before submitting.
 *
 * The question is skipped for a single-month line: there is no other month it
 * could apply to.
 */
export default function IncomeLineEditDialog({
  line,
  monthKey,
  isOpen,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const updateMutation = useUpdateIncomeLine();
  const [scope, setScope] = useState<IncomeChangeScope>(
    IncomeChangeScope.FromNowOn,
  );

  const monthLabel = formatMonthKey(monthKey);
  const isSingleMonth = line !== null && line.end_month === line.start_month;
  const canChooseScope = line !== null && !isSingleMonth;

  function handleSubmit(values: IncomeLineFormValues) {
    if (!line) return;
    updateMutation.mutate(
      {
        id: line.id,
        label: values.label,
        amount: values.amount,
        month: monthKey,
        scope: canChooseScope ? scope : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t('income.updated'));
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
          <DialogTitle>{t('income.form.editTitle')}</DialogTitle>
          <DialogDescription>
            {isSingleMonth
              ? t('income.form.editSingleMonthDescription', { month: monthLabel })
              : t('income.form.editDescription', { month: monthLabel })}
          </DialogDescription>
        </DialogHeader>

        {canChooseScope && (
          <div className="flex flex-col gap-2">
            {/* `htmlFor` rather than wrapping the Label in another `<label>`:
                shadcn's Label renders a `<label>` of its own, and nested labels
                are invalid HTML — the text stops activating the radio, leaving
                only the tiny circle clickable. */}
            <div className="flex items-start gap-2">
              <input
                id="income-scope-from-now-on"
                type="radio"
                name="income-change-scope"
                className="mt-1"
                checked={scope === IncomeChangeScope.FromNowOn}
                onChange={() => setScope(IncomeChangeScope.FromNowOn)}
              />
              <Label htmlFor="income-scope-from-now-on" className="cursor-pointer">
                {t('income.form.scopeFromNowOn', { month: monthLabel })}
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                id="income-scope-this-month"
                type="radio"
                name="income-change-scope"
                className="mt-1"
                checked={scope === IncomeChangeScope.ThisMonth}
                onChange={() => setScope(IncomeChangeScope.ThisMonth)}
              />
              <Label htmlFor="income-scope-this-month" className="cursor-pointer">
                {t('income.form.scopeThisMonth', { month: monthLabel })}
              </Label>
            </div>
          </div>
        )}

        {/* Remounted per opening so the fields always reflect the chosen line. */}
        {isOpen && line && (
          <IncomeLineForm
            monthLabel={monthLabel}
            initialValues={{ label: line.label, amount: line.amount }}
            isPending={updateMutation.isPending}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
