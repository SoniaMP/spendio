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
  if (isLoading) {
    return (
      <Badge variant="secondary" className="animate-pulse">
        Cargando...
      </Badge>
    );
  }

  if (comparison.percentageChange === 100 && comparison.direction === 'up') {
    return (
      <Badge variant="secondary">Sin datos de {previousMonthLabel}</Badge>
    );
  }

  if (comparison.direction === 'equal') {
    return (
      <Badge variant="secondary">
        Igual que {previousMonthLabel}
      </Badge>
    );
  }

  const isDown = comparison.direction === 'down';
  const arrow = isDown ? '▼' : '▲';
  const formatted = comparison.percentageChange.toFixed(1).replace('.', ',');

  return (
    <Badge variant={isDown ? 'default' : 'destructive'}>
      {arrow} {formatted}% vs {previousMonthLabel}
    </Badge>
  );
}
