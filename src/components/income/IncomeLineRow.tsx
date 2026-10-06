import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/helpers/formatCurrency';
import { formatMonthKey } from '@/helpers/formatMonthKey';
import type { IncomeLine } from '@/types/income';

interface Props {
  line: IncomeLine;
  onEdit: (line: IncomeLine) => void;
  onCancel: (line: IncomeLine) => void;
}

/**
 * The line type is derived from the interval, never stored — see the rules in
 * `docs/business/features/05.income.md`.
 */
function useLineBadge(line: IncomeLine): string {
  const { t } = useTranslation();

  if (line.end_month === null) return t('income.badge.recurring');
  if (line.end_month === line.start_month) return t('income.badge.singleMonth');
  return t('income.badge.until', { month: formatMonthKey(line.end_month) });
}

export default function IncomeLineRow({ line, onEdit, onCancel }: Props) {
  const { t } = useTranslation();
  const badge = useLineBadge(line);

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{line.label}</span>
          <Badge variant="outline">{badge}</Badge>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatCurrency(line.amount)}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('income.edit.action', { label: line.label })}
          onClick={() => onEdit(line)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('income.cancel.action', { label: line.label })}
          onClick={() => onCancel(line)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
