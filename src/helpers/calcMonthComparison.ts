export interface MonthComparison {
  percentageChange: number;
  direction: 'up' | 'down' | 'equal';
}

export function calcMonthComparison(
  currentTotal: number,
  previousTotal: number,
): MonthComparison {
  if (previousTotal === 0 && currentTotal === 0) {
    return { percentageChange: 0, direction: 'equal' };
  }

  if (previousTotal === 0) {
    return { percentageChange: 100, direction: 'up' };
  }

  const change = ((currentTotal - previousTotal) / previousTotal) * 100;

  if (change === 0) {
    return { percentageChange: 0, direction: 'equal' };
  }

  return {
    percentageChange: Math.abs(change),
    direction: change > 0 ? 'up' : 'down',
  };
}
