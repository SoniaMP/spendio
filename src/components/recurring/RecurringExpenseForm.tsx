import { useState, type FormEvent } from 'react';
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
        <Label htmlFor="rec-amount">Importe</Label>
        <Input id="rec-amount" type="number" step="0.01" min="0.01" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="0,00" required autoFocus />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-description">Descripción</Label>
        <Input id="rec-description" value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Alquiler, Netflix..." />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Categoría</Label>
        <CategoryCombobox value={categoryId} onChange={setCategoryId} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-period">Periodo</Label>
          <Select value={period} onValueChange={(v) => setPeriod(v as RecurringPeriod)}>
            <SelectTrigger id="rec-period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rec-start-date">Fecha de inicio</Label>
          <Input id="rec-start-date" type="date" value={startDate} min={minDate}
            onChange={(e) => setStartDate(e.target.value)} required />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-end-date">Fecha de fin (opcional)</Label>
        <Input id="rec-end-date" type="date" value={endDate} min={startDate}
          onChange={(e) => setEndDate(e.target.value)} placeholder="Sin fecha de fin" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="rec-notice-days">Avisarme con X días de antelación</Label>
        <Input id="rec-notice-days" type="number" min="0" step="1" value={noticeDays}
          onChange={(e) => setNoticeDays(e.target.value)} required />
      </div>
      <Button type="submit" disabled={isPending || !isValid}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}
