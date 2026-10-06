import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IncomeRecurrence } from '@/types/incomeRecurrence';

export interface IncomeLineFormValues {
  label: string;
  amount: number;
  isRecurring: boolean;
}

interface Props {
  /** Localized label of the month the line starts in, or is being edited from. */
  monthLabel: string;
  /** Present when editing: prefills the fields and hides the recurrence choice. */
  initialValues?: { label: string; amount: number };
  isPending: boolean;
  onSubmit: (values: IncomeLineFormValues) => void;
}

export default function IncomeLineForm({
  monthLabel,
  initialValues,
  isPending,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const isEditing = initialValues !== undefined;
  const [label, setLabel] = useState(initialValues?.label ?? '');
  const [amount, setAmount] = useState(
    initialValues?.amount?.toString() ?? '',
  );
  const [recurrence, setRecurrence] = useState<IncomeRecurrence>(
    IncomeRecurrence.Recurring,
  );

  const parsedAmount = parseFloat(amount);
  const isValid = label.trim() !== '' && parsedAmount > 0;

  function submitLabel(): string {
    if (isPending) return isEditing ? t('common.saving') : t('common.creating');
    return isEditing ? t('common.save') : t('common.create');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid) return;
    onSubmit({
      label: label.trim(),
      amount: parsedAmount,
      isRecurring: recurrence === IncomeRecurrence.Recurring,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="income-label">{t('income.form.label')}</Label>
        <Input
          id="income-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('income.form.labelPlaceholder')}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="income-amount">{t('income.form.amount')}</Label>
        <Input
          id="income-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('expenses.form.amountPlaceholder')}
        />
      </div>

      {!isEditing && (
      <div className="flex flex-col gap-2">
        <Label htmlFor="income-recurrence">{t('income.form.recurrence')}</Label>
        <Select
          value={recurrence}
          onValueChange={(value) => setRecurrence(value as IncomeRecurrence)}
        >
          <SelectTrigger id="income-recurrence">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={IncomeRecurrence.Recurring}>
              {t('income.form.recurring', { month: monthLabel })}
            </SelectItem>
            <SelectItem value={IncomeRecurrence.SingleMonth}>
              {t('income.form.singleMonth', { month: monthLabel })}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      )}

      <Button type="submit" disabled={!isValid || isPending}>
        {submitLabel()}
      </Button>
    </form>
  );
}
