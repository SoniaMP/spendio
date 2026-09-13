import { useTranslation } from 'react-i18next';
import type { ExpenseWithCategory } from '@/types/expense';
import { groupExpensesByCategory } from '@/helpers/groupExpensesByCategory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ExpensePieChart from '@/components/expenses/ExpensePieChart';
import ExpenseBarChart from '@/components/expenses/ExpenseBarChart';
import ChartLegend from '@/components/expenses/ChartLegend';

interface ExpenseChartProps {
  expenses: ExpenseWithCategory[];
}

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  const { t } = useTranslation();

  if (expenses.length === 0) return null;

  const data = groupExpensesByCategory(expenses);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('expenses.chart.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie">
          <TabsList>
            <TabsTrigger value="pie">{t('expenses.chart.pie')}</TabsTrigger>
            <TabsTrigger value="bar">{t('expenses.chart.bar')}</TabsTrigger>
          </TabsList>

          <TabsContent value="pie">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="w-full sm:w-1/2">
                <ExpensePieChart data={data} />
              </div>
              <div className="w-full sm:w-1/2">
                <ChartLegend items={data} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bar">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="w-full sm:w-1/2">
                <ExpenseBarChart data={data} />
              </div>
              <div className="w-full sm:w-1/2">
                <ChartLegend items={data} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
