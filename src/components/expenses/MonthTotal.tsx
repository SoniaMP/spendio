import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/helpers/formatCurrency';

interface MonthTotalProps {
  total: number;
}

export default function MonthTotal({ total }: MonthTotalProps) {
  const { t } = useTranslation();

  return (
    <div>
      <p className="text-sm text-muted-foreground">{t('expenses.comparison.monthTotal')}</p>
      <p className="text-xl font-bold">{formatCurrency(total)}</p>
    </div>
  );
}
