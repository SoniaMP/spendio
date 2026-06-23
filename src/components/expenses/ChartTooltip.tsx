import { formatCurrency } from '@/helpers/formatCurrency';

interface CategoryDatum {
  categoryName: string;
  amount: number;
  percentage: number;
}

// Recharts injects these props into the custom tooltip content; we only type
// the subset we use to stay decoupled from recharts' internal Tooltip types.
interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: CategoryDatum }[];
}

export default function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{data.categoryName}</p>
      <p className="text-muted-foreground">
        {formatCurrency(data.amount)} ({data.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}
