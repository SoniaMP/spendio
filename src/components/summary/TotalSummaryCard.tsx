import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/helpers/formatCurrency';
import ChartTooltip from '@/components/expenses/ChartTooltip';
import type { CategoryTotal } from '@/types/summary';

interface TotalSummaryCardProps {
  total: number;
  categories: CategoryTotal[];
}

export default function TotalSummaryCard({
  total,
  categories,
}: TotalSummaryCardProps) {
  const chartData = categories.map((c) => ({
    categoryName: c.categoryName,
    color: c.categoryColor,
    amount: c.total,
    percentage: total > 0 ? (c.total / total) * 100 : 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Total</CardTitle>
          <span className="text-xl font-bold">{formatCurrency(total)}</span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="amount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.categoryName} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 flex flex-col gap-1.5">
          {categories.map((cat) => (
            <div key={cat.categoryId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: cat.categoryColor }}
                />
                <span>{cat.categoryName}</span>
              </div>
              <span className="text-muted-foreground">
                {formatCurrency(cat.total)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
