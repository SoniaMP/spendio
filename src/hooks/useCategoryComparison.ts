import { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { groupExpensesByCategory } from '@/helpers/groupExpensesByCategory';
import { getComparisonMonths } from '@/helpers/getComparisonMonths';
import type { ExpenseWithCategory } from '@/types/expense';
import type { CategoryBreakdown } from '@/types/chartData';
import type { MonthOption } from '@/helpers/getComparisonMonths';

interface UseCategoryComparisonOptions {
  sheetId: number;
  year: number;
  month: number;
  monthKey: string;
  previousMonthKey: string;
  previousExpenses: ExpenseWithCategory[] | undefined;
  isPreviousLoading: boolean;
}

interface UseCategoryComparisonResult {
  comparisonMonthKey: string;
  comparisonBreakdown: CategoryBreakdown[];
  comparisonMonthOptions: MonthOption[];
  isComparisonLoading: boolean;
  handleComparisonMonthChange: (key: string) => void;
}

export function useCategoryComparison({
  sheetId,
  year,
  month,
  monthKey,
  previousMonthKey,
  previousExpenses,
  isPreviousLoading,
}: UseCategoryComparisonOptions): UseCategoryComparisonResult {
  const [comparisonState, setComparisonState] = useState({
    forMonth: monthKey,
    selectedKey: previousMonthKey,
  });

  const comparisonMonthKey =
    comparisonState.forMonth === monthKey
      ? comparisonState.selectedKey
      : previousMonthKey;

  const isComparisonSameAsPrevious = comparisonMonthKey === previousMonthKey;

  const { data: comparisonExpenses, isLoading: isComparisonLoading } =
    useExpenses(
      sheetId,
      isComparisonSameAsPrevious ? undefined : comparisonMonthKey,
    );

  const effectiveExpenses = isComparisonSameAsPrevious
    ? previousExpenses
    : comparisonExpenses;
  const effectiveLoading = isComparisonSameAsPrevious
    ? isPreviousLoading
    : isComparisonLoading;

  const comparisonBreakdown = useMemo(
    () => groupExpensesByCategory(effectiveExpenses ?? []),
    [effectiveExpenses],
  );

  const comparisonMonthOptions = useMemo(
    () => getComparisonMonths(year, month),
    [year, month],
  );

  function handleComparisonMonthChange(key: string) {
    setComparisonState({ forMonth: monthKey, selectedKey: key });
  }

  return {
    comparisonMonthKey,
    comparisonBreakdown,
    comparisonMonthOptions,
    isComparisonLoading: effectiveLoading,
    handleComparisonMonthChange,
  };
}
