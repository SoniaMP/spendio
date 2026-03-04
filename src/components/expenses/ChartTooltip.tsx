import type { TooltipProps } from 'recharts';
import { formatCurrency } from '@/helpers/formatCurrency';

type ChartTooltipProps = TooltipProps<number, string>;

export default function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as {
    categoryName: string;
    amount: number;
    percentage: number;
  };

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{data.categoryName}</p>
      <p className="text-muted-foreground">
        {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}
