import { useTranslation } from 'react-i18next';
import { ArrowDownToLine, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/helpers/formatCurrency';
import { useMonthlyIncome } from '@/hooks/useMonthlyIncome';

interface MonthlyIncomeChipProps {
  /** Month currently shown by the expenses view, `'YYYY-MM'`. */
  monthKey: string;
  /** Opens the income lines panel. The chip is display-only without it. */
  onOpenLines?: () => void;
}

const BOX_CLASSES = 'rounded-md bg-muted/50 px-2.5 py-1';

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
 * - No words. The icon labels the box, the remaining leads because it answers
 *   the user's question, and the income figure trails as muted context.
 * - Recessive through hierarchy (soft background, muted token, smaller size),
 *   never through `opacity`, which would drop a number people have to read
 *   below the accessible contrast ratio.
 * - Colour is reserved for one thing: a negative remaining. The remaining is
 *   never dimmed — overspending is the moment the chip should be loud.
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
  const accessibleName = t('income.tooltip', {
    remaining: formatCurrency(data.remaining),
    amount: formatCurrency(data.amount),
    spent: formatCurrency(data.spent),
  });

  const content = (
    <>
      <ArrowDownToLine className="size-3.5 shrink-0 text-muted-foreground" />
      <span
        className={`font-semibold tabular-nums ${
          isOverspent ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {formatCurrency(data.remaining)}
      </span>
      <span className="hidden text-muted-foreground sm:inline">·</span>
      <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
        {formatCurrency(data.amount)}
      </span>
    </>
  );

  if (!onOpenLines) {
    return (
      <div
        className={`flex items-center gap-1.5 text-sm ${BOX_CLASSES}`}
        title={accessibleName}
        aria-label={accessibleName}
      >
        {content}
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-1.5 hover:bg-muted ${BOX_CLASSES}`}
      onClick={onOpenLines}
      title={accessibleName}
      aria-label={accessibleName}
    >
      {content}
    </Button>
  );
}
