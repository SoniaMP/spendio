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
import CategoryCombobox from '@/components/categories/CategoryCombobox';
import type { RecurringPeriod } from '@/types/recurringExpense';

export interface RecurringFormValues {
  amount: number;
  description: string;
  categoryId: number;
  period: RecurringPeriod;
  startDate: string;
  endDate: string | null;
  noticeDays: number;
}

interface Props {
  initialValues?: Partial<RecurringFormValues>;
  isEditing: boolean;
  isPending: boolean;
  onSubmit: (values: RecurringFormValues) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function RecurringExpenseForm({
  initialValues,
  isEditing,
  isPending,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues?.categoryId ?? null,
  );
  const [period, setPeriod] = useState<RecurringPeriod>(initialValues?.period ?? 'monthly');
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? today());
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? '');
  const [noticeDays, setNoticeDays] = useState(initialValues?.noticeDays?.toString() ?? '3');

  const parsedAmount = parseFloat(amount);
  const parsedNoticeDays = parseInt(noticeDays, 10);
  const minDate = isEditing ? undefined : today();
  const isEndDateValid = !endDate || endDate >= startDate;
  const isValid =
    parsedAmount > 0 &&
    categoryId !== null &&
    parsedNoticeDays >= 0 &&
    isEndDateValid &&
    (isEditing || startDate >= today());

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || categoryId === null) return;
    onSubmit({
      amount: parsedAmount,
      description: description.trim(),
      categoryId,
      period,
      startDate,
      endDate: endDate || null,
      noticeDays: parsedNoticeDays,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-amount">{t('expenses.columns.amount')}</Label>
        <Input id="rec-amount" type="number" step="0.01" min="0.01" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder={t('expenses.form.amountPlaceholder')} required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-description">{t('expenses.columns.description')}</Label>
        <Input id="rec-description" value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder={t('recurring.form.descriptionPlaceholder')} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="recurring-category">{t('expenses.columns.category')}</Label>
        <CategoryCombobox
          id="recurring-category"
          value={categoryId}
          onChange={setCategoryId}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-period">{t('recurring.period.label')}</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as RecurringPeriod)}>
            <SelectTrigger id="rec-period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">{t('recurring.period.monthly')}</SelectItem>
              <SelectItem value="yearly">{t('recurring.period.yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-start-date">{t('recurring.form.startDate')}</Label>
          <Input id="rec-start-date" type="date" value={startDate} min={minDate}
            onChange={(e) => setStartDate(e.target.value)} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-end-date">{t('recurring.form.endDate')}</Label>
        <Input id="rec-end-date" type="date" value={endDate} min={startDate}
          onChange={(e) => setEndDate(e.target.value)} placeholder={t('recurring.form.endDatePlaceholder')} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-notice-days">{t('recurring.form.noticeDays')}</Label>
        <Input id="rec-notice-days" type="number" min="0" step="1" value={noticeDays}
          onChange={(e) => setNoticeDays(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isPending || !isValid}>
        {isPending ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}
