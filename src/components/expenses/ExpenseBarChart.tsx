import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import type { CategoryBreakdown } from '@/types/chartData';
import ChartTooltip from '@/components/expenses/ChartTooltip';
import { formatCurrency } from '@/helpers/formatCurrency';

interface ExpenseBarChartProps {
  data: CategoryBreakdown[];
}

export default function ExpenseBarChart({ data }: ExpenseBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatCurrency(value)}
          fontSize={12}
        />
        <YAxis
          type="category"
          dataKey="categoryName"
          width={100}
          fontSize={12}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.categoryName} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
