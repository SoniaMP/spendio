import { formatCurrency } from '@/helpers/formatCurrency';

interface MonthTotalProps {
  total: number;
}

export default function MonthTotal({ total }: MonthTotalProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Total del mes</p>
      <p className="text-xl font-bold">{formatCurrency(total)}</p>
    </div>
  );
}
