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
      <BarChart data={data} margin={{ bottom: 40 }}>
        <XAxis
          type="category"
          dataKey="categoryName"
          fontSize={11}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          type="number"
          tickFormatter={(value: number) => formatCurrency(value)}
          fontSize={12}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.categoryName} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
