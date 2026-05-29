import { MoreVertical, Pause, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToggleRecurringExpense } from '@/hooks/useRecurringExpenses';
import { formatCurrency } from '@/helpers/formatCurrency';
import { formatDate } from '@/helpers/formatDate';
import { nextDueDate } from '@/helpers/computeNextDue';
import type { RecurringExpense } from '@/types/recurringExpense';
import { toast } from 'sonner';

interface Props {
  template: RecurringExpense;
  onEdit: (t: RecurringExpense) => void;
  onDelete: (t: RecurringExpense) => void;
}

const PERIOD_LABEL: Record<RecurringExpense['period'], string> = {
  monthly: '/ mes',
  yearly: '/ año',
};

export default function RecurringExpenseRow({ template, onEdit, onDelete }: Props) {
  const toggleMutation = useToggleRecurringExpense();
  const isActive = template.is_active === 1;
  const hasCategory = template.category_id !== null;

  function handleToggle() {
    toggleMutation.mutate(
      { id: template.id, isActive: !isActive },
      {
        onSuccess: () => toast.success(isActive ? 'Recurrente pausado' : 'Recurrente activado'),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{template.description || 'Sin descripción'}</span>
          {!isActive && <Badge variant="outline">Pausado</Badge>}
          {!hasCategory && <Badge variant="destructive">Sin categoría</Badge>}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(template.amount)} {PERIOD_LABEL[template.period]}
          {hasCategory && isActive && (
            <> · Próximo: <span className="font-medium">{formatDate(nextDueDate(template))}</span></>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label="Acciones">
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(template)}>
            <Pencil /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle} disabled={toggleMutation.isPending}>
            {isActive ? <><Pause /> Pausar</> : <><Play /> Activar</>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
            <Trash2 /> Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
