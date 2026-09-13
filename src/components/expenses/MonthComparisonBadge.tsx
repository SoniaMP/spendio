import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import type { MonthComparison } from '@/helpers/calcMonthComparison';

interface MonthComparisonBadgeProps {
  comparison: MonthComparison;
  previousMonthLabel: string;
  isLoading: boolean;
}

export default function MonthComparisonBadge({
  comparison,
  previousMonthLabel,
  isLoading,
}: MonthComparisonBadgeProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        {t('common.loading')}
      </Badge>
    );
  }

  if (comparison.percentageChange === 100 && comparison.direction === 'up') {
    return (
      <Badge variant="secondary">
        {t('expenses.comparison.noPreviousData', { month: previousMonthLabel })}
      </Badge>
    );
  }

  if (comparison.direction === 'equal') {
    return (
      <Badge variant="secondary">
        {t('expenses.comparison.equal', { month: previousMonthLabel })}
      </Badge>
    );
  }

  const isDown = comparison.direction === 'down';
  const arrow = isDown ? '▼' : '▲';
  const formatted = comparison.percentageChange.toFixed(1).replace('.', ',');

  return (
    <Badge variant={isDown ? 'default' : 'destructive'}>
      {t('expenses.comparison.change', {
        arrow,
        percentage: formatted,
        month: previousMonthLabel,
      })}
    </Badge>
  );
}
