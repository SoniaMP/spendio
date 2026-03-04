import { useState, useCallback } from 'react';
import { getCurrentMonth, getMonthKey, getMonthLabel } from '@/helpers/dateHelpers';

export interface MonthFilter {
  year: number;
  month: number;
  monthKey: string;
  monthLabel: string;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
}

export function useMonthFilter(): MonthFilter {
  const [state, setState] = useState(getCurrentMonth);

  const goToPreviousMonth = useCallback(() => {
    setState((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setState((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  }, []);

  return {
    year: state.year,
    month: state.month,
    monthKey: getMonthKey(state.year, state.month),
    monthLabel: getMonthLabel(state.year, state.month),
    goToPreviousMonth,
    goToNextMonth,
  };
}
