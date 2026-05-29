import { describe, it, expect } from 'vitest';
import {
  computeDueDateForPeriodIndex,
  nextDueDate,
} from '@/helpers/computeNextDue';
import type { RecurringExpense } from '@/types/recurringExpense';

function buildTemplate(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: 1,
    user_id: 1,
    sheet_id: 1,
    category_id: 1,
    amount: 50,
    description: '',
    period: 'monthly',
    start_date: '2026-06-15',
    end_date: null,
    notice_days: 3,
    is_active: 1,
    last_generated_period_index: -1,
    last_notified_period_index: -1,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('computeDueDateForPeriodIndex', () => {
  it('monthly: index 0 is start_date', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-06-15', 0)).toBe('2026-06-15');
  });

  it('monthly: clamps Jan 31 to Feb 28 non-leap', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-01-31', 1)).toBe('2026-02-28');
  });

  it('yearly: index 2 advances two years', () => {
    expect(computeDueDateForPeriodIndex('yearly', '2026-05-20', 2)).toBe('2028-05-20');
  });
});

describe('nextDueDate', () => {
  it('returns start_date when nothing generated', () => {
    const t = buildTemplate({ start_date: '2026-06-15' });
    expect(nextDueDate(t)).toBe('2026-06-15');
  });

  it('advances to the next period after first generation', () => {
    const t = buildTemplate({
      start_date: '2026-06-15',
      last_generated_period_index: 0,
    });
    expect(nextDueDate(t)).toBe('2026-07-15');
  });
});
