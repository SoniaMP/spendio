import type { CategoryBreakdown } from '@/types/chartData';
import { formatCurrency } from '@/helpers/formatCurrency';

interface ChartLegendProps {
  items: CategoryBreakdown[];
}

export default function ChartLegend({ items }: ChartLegendProps) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <div key={item.categoryName} className="flex items-center gap-1.5">
          <span
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="truncate">{item.categoryName}</span>
          <span className="shrink-0 text-muted-foreground">
            {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  );
}
