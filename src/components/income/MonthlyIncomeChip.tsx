import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/helpers/formatCurrency';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';

interface MonthlyIncomeChipProps {
  /** Month currently shown by the expenses view, `'YYYY-MM'`. */
  monthKey: string;
  /** Opens the income lines panel. The chip is display-only without it. */
  onOpenLines?: () => void;
}

/**
 * Shows the month's income figure and what is left of it after everything the
 * user spent — the number the whole feature exists for.
 *
 * It lives in the expenses toolbar because that is the only place that knows
 * which month is on screen, and because it is where expenses get logged, so the
 * figure visibly drops as the user works. Note that `spent` covers **every
 * sheet**, unlike the `MonthTotal` next to it, which is scoped to the active
 * sheet; the tooltip spells that out so the two numbers do not read as
 * contradictory.
 */
export default function MonthlyIncomeChip({
  monthKey,
  onOpenLines,
}: MonthlyIncomeChipProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useMonthlyIncome(monthKey);

  // The chip is secondary to logging expenses: while it loads, and if it fails,
  // it stays out of the way rather than flashing a placeholder or an error into
  // the toolbar.
  if (isLoading || isError || !data) return null;

  if (data.lines.length === 0) {
    if (!onOpenLines) return null;
    return (
      <Button variant="ghost" size="sm" onClick={onOpenLines}>
        <Plus /> <span className="hidden sm:inline">{t('income.add')}</span>
      </Button>
    );
  }

  const isOverspent = data.remaining < 0;
  const tooltip = t('income.tooltip', {
    remaining: formatCurrency(data.remaining),
    amount: formatCurrency(data.amount),
    spent: formatCurrency(data.spent),
  });

  const content = (
    <>
      <span className="text-muted-foreground">{t('income.label')}</span>
      <span className="tabular-nums">{formatCurrency(data.amount)}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground hidden sm:inline">
        {t('income.remainingLabel')}
      </span>
      <span
        className={`font-semibold tabular-nums ${
          isOverspent ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {formatCurrency(data.remaining)}
      </span>
    </>
  );

  if (!onOpenLines) {
    return (
      <div
        className="flex items-center gap-1.5 text-sm"
        title={tooltip}
        aria-label={tooltip}
      >
        {content}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={onOpenLines}
      title={tooltip}
      aria-label={tooltip}
    >
      {content}
    </Button>
  );
}
