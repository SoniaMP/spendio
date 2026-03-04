import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CategoryCombobox from '@/components/categories/CategoryCombobox';

interface ExpenseFormValues {
  amount: number;
  description: string;
  date: string;
  categoryId: number;
}

interface ExpenseFormProps {
  initialValues?: ExpenseFormValues;
  onSubmit: (values: ExpenseFormValues) => void;
  isPending: boolean;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({
  initialValues,
  onSubmit,
  isPending,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(
    initialValues?.amount?.toString() ?? '',
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [date, setDate] = useState(initialValues?.date ?? getToday());
  const [categoryId, setCategoryId] = useState<number | null>(
    initialValues?.categoryId ?? null,
  );

  const parsedAmount = parseFloat(amount);
  const isValid = parsedAmount > 0 && !!date && categoryId !== null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid || categoryId === null) return;
    onSubmit({
      amount: parsedAmount,
      description: description.trim(),
      date,
      categoryId,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-amount">Importe</Label>
        <Input
          id="expense-amount"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          required
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-description">Descripción</Label>
        <Input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Compra supermercado"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-date">Fecha</Label>
        <Input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Categoría</Label>
        <CategoryCombobox value={categoryId} onChange={setCategoryId} />
      </div>

      <Button type="submit" disabled={isPending || !isValid}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
}
