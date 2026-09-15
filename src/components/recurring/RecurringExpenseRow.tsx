import { Trans, useTranslation } from 'react-i18next';
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
import { getErrorMessage } from '@/lib/errorMessage';

interface Props {
  template: RecurringExpense;
  onEdit: (t: RecurringExpense) => void;
  onDelete: (t: RecurringExpense) => void;
}

export default function RecurringExpenseRow({ template, onEdit, onDelete }: Props) {
  const { t } = useTranslation();
  const toggleMutation = useToggleRecurringExpense();
  const isActive = template.is_active === 1;
  const hasCategory = template.category_id !== null;

  function handleToggle() {
    toggleMutation.mutate(
      { id: template.id, isActive: !isActive },
      {
        onSuccess: () =>
          toast.success(isActive ? t('recurring.paused') : t('recurring.activated')),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{template.description || t('recurring.noDescription')}</span>
          {!isActive && <Badge variant="outline">{t('recurring.pausedBadge')}</Badge>}
          {!hasCategory && <Badge variant="destructive">{t('recurring.noCategoryBadge')}</Badge>}
        </div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(template.amount)}{' '}
          {template.period === 'monthly'
            ? t('recurring.period.perMonth')
            : t('recurring.period.perYear')}
          {hasCategory && isActive && (
            <>
              {' '}
              <Trans
                i18nKey="recurring.nextDue"
                values={{ date: formatDate(nextDueDate(template)) }}
                components={{ date: <span className="font-medium" /> }}
              />
            </>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-xs" aria-label={t('common.actions')}>
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(template)}>
            <Pencil /> {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggle} disabled={toggleMutation.isPending}>
            {isActive ? (
              <>
                <Pause /> {t('recurring.pause')}
              </>
            ) : (
              <>
                <Play /> {t('recurring.activate')}
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
            <Trash2 /> {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
