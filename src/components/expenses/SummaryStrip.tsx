import type { MonthComparison } from '@/helpers/calcMonthComparison';
import type { CategoryBreakdown } from '@/types/chartData';
import MonthTotal from '@/components/expenses/MonthTotal';
import MonthComparisonBadge from '@/components/expenses/MonthComparisonBadge';
import TopCategories from '@/components/expenses/TopCategories';

interface SummaryStripProps {
  currentTotal: number;
  comparison: MonthComparison;
  previousMonthLabel: string;
  isComparisonLoading: boolean;
  topCategories: CategoryBreakdown[];
}

export default function SummaryStrip({
  currentTotal,
  comparison,
  previousMonthLabel,
  isComparisonLoading,
  topCategories,
}: SummaryStripProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <MonthTotal total={currentTotal} />
      <MonthComparisonBadge
        comparison={comparison}
        previousMonthLabel={previousMonthLabel}
        isLoading={isComparisonLoading}
      />
      <div className="sm:ml-auto">
        <TopCategories categories={topCategories} />
      </div>
    </div>
  );
}
