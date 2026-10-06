import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/helpers/formatCurrency';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';

interface MonthlyIncomeChipProps {
  /** Month currently shown by the expenses view, `'YYYY-MM'`. */
  monthKey: string;
  onAddLine: () => void;
  onManageLines: () => void;
}

/**
 * Shows what is left of the month's income after everything the user spent —
 * the number the whole feature exists for.
 *
 * It lives in the expenses toolbar because that is the only place that knows
 * which month is on screen, and because it is where expenses get logged, so the
 * figure visibly drops as the user works. Note that the spent side covers
 * **every sheet**, unlike the `MonthTotal` further down, which is scoped to the
 * active sheet; the box groups these numbers so the two do not read as one, and
 * the accessible name spells the difference out.
 *
 * Design notes, decided deliberately:
 * - No words for the figures. The icon labels the box, the remaining leads
 *   because it answers the user's question, and the income figure trails as
 *   muted context that hides on narrow screens.
 * - The actions are **explicit buttons**, not a clickable box: nothing should
 *   require knowing that a figure is secretly a link. They sit inside the
 *   border so the toolbar reads as one income control instead of loose buttons.
 * - Recessive through hierarchy (soft background, muted token, smaller size),
 *   never through `opacity`, which would drop a number people have to read
 *   below the accessible contrast ratio.
 * - Colour is reserved for one thing: a negative remaining. The remaining is
 *   never dimmed — overspending is the moment the chip should be loud.
 */
export default function MonthlyIncomeChip({
  monthKey,
  onAddLine,
  onManageLines,
}: MonthlyIncomeChipProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMonthlyIncome(monthKey);

  // The chip is secondary to logging expenses: while it loads, and if it fails,
  // it stays out of the way rather than flashing a placeholder or an error into
  // the toolbar.
  if (isLoading || isError || !data) return null;

  if (data.lines.length === 0) {
    return (
      <Button variant="ghost" size="sm" onClick={onAddLine}>
        <Plus /> <span className="hidden sm:inline">{t('income.add')}</span>
      </Button>
    );
  }

  const isOverspent = data.remaining < 0;
  const accessibleName = t('income.tooltip', {
    remaining: formatCurrency(data.remaining),
    amount: formatCurrency(data.amount),
    spent: formatCurrency(data.spent),
  });

  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 py-1 pl-2.5 pr-1 text-sm">
      <ArrowDownToLine className="size-3.5 shrink-0 text-muted-foreground" />
      <span
        className={`font-semibold tabular-nums ${
          isOverspent ? 'text-destructive' : 'text-foreground'
        }`}
        title={accessibleName}
        aria-label={accessibleName}
      >
        {formatCurrency(data.remaining)}
      </span>
      <span className="hidden text-muted-foreground sm:inline">·</span>
      <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
        {formatCurrency(data.amount)}
      </span>

      <Separator orientation="vertical" className="mx-0.5 !h-4" />

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onAddLine}
        aria-label={t('income.addLine')}
        title={t('income.addLine')}
      >
        <Plus />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onManageLines}
        aria-label={t('income.manage')}
        title={t('income.manage')}
      >
        <Pencil />
      </Button>
    </div>
  );
}
