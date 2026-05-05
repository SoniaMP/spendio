import { useMemo, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useDuplicateExpense } from '@/hooks/useExpenses';
import { useSheets } from '@/hooks/useSheets';
import { clampDayToMonth } from '@/helpers/clampDayToMonth';
import type { ExpenseWithCategory } from '@/types/expense';

export interface DuplicateSuccessInfo {
  targetSheetId: number;
  targetYear: number;
  targetMonth: number;
}

interface DuplicateExpenseDialogProps {
  expense: ExpenseWithCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (info: DuplicateSuccessInfo) => void;
}

function getDefaultTargetMonth(sourceDate: string): string {
  const [yearStr, monthStr] = sourceDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

export default function DuplicateExpenseDialog({
  expense,
  isOpen,
  onClose,
  onSuccess,
}: DuplicateExpenseDialogProps) {
  const { data: sheets } = useSheets();
  const duplicateMutation = useDuplicateExpense();

  const editableSheets = useMemo(
    () =>
      (sheets ?? []).filter(
        (s) => s.permission === 'owner' || s.permission === 'edit',
      ),
    [sheets],
  );

  const [targetSheetId, setTargetSheetId] = useState<number | null>(null);
  const [targetMonth, setTargetMonth] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializedForId, setInitializedForId] = useState<number | null>(null);

  if (isOpen && expense && initializedForId !== expense.id) {
    setInitializedForId(expense.id);
    setTargetSheetId(expense.sheet_id);
    setTargetMonth(getDefaultTargetMonth(expense.date));
    setErrorMessage(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!expense || targetSheetId === null || !targetMonth) return;

    const [yearStr, monthStr] = targetMonth.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(expense.date.slice(8, 10));
    const resolvedDate = clampDayToMonth(year, month, day);

    duplicateMutation.mutate(
      { id: expense.id, targetSheetId, date: resolvedDate },
      {
        onSuccess: () => {
          onSuccess({ targetSheetId, targetYear: year, targetMonth: month });
          onClose();
        },
        onError: (err) => setErrorMessage(err.message),
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicar gasto</DialogTitle>
          <DialogDescription>
            Crea una copia del gasto en otra hoja o mes. Si el día no existe en
            el mes destino, se ajusta al último día.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="duplicate-target-sheet">Hoja destino</Label>
            <Select
              value={targetSheetId !== null ? String(targetSheetId) : ''}
              onValueChange={(v) => setTargetSheetId(Number(v))}
            >
              <SelectTrigger id="duplicate-target-sheet" className="w-full">
                <SelectValue placeholder="Selecciona una hoja" />
              </SelectTrigger>
              <SelectContent>
                {editableSheets.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="duplicate-target-month">Mes destino</Label>
            <Input
              id="duplicate-target-month"
              type="month"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              required
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                duplicateMutation.isPending ||
                targetSheetId === null ||
                !targetMonth
              }
            >
              {duplicateMutation.isPending ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
