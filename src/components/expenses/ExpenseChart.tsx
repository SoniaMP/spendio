import type { ExpenseWithCategory } from '@/types/expense';
import { groupExpensesByCategory } from '@/helpers/groupExpensesByCategory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ExpensePieChart from '@/components/expenses/ExpensePieChart';
import ExpenseBarChart from '@/components/expenses/ExpenseBarChart';
import ChartLegend from '@/components/expenses/ChartLegend';

interface ExpenseChartProps {
  expenses: ExpenseWithCategory[];
}

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  if (expenses.length === 0) return null;

  const data = groupExpensesByCategory(expenses);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Gastos por categoría</h2>

      <Tabs defaultValue="pie">
        <TabsList>
          <TabsTrigger value="pie">Circular</TabsTrigger>
          <TabsTrigger value="bar">Barras</TabsTrigger>
        </TabsList>

        <TabsContent value="pie">
          <ExpensePieChart data={data} />
        </TabsContent>

        <TabsContent value="bar">
          <ExpenseBarChart data={data} />
        </TabsContent>
      </Tabs>

      <ChartLegend items={data} />
    </div>
  );
}
