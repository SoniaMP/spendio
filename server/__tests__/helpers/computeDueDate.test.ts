import { describe, it, expect } from 'vitest';
import { computeDueDateForPeriodIndex } from '../../helpers/computeDueDate.ts';

describe('computeDueDateForPeriodIndex', () => {
  it('monthly: index 0 returns start_date', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-03-15', 0)).toBe('2026-03-15');
  });

  it('monthly: index 1 returns next month same day', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-03-15', 1)).toBe('2026-04-15');
  });

  it('monthly: crosses year boundary', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-11-10', 3)).toBe('2027-02-10');
  });

  it('monthly: clamps Jan 31 to Feb 28 on non-leap year', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-01-31', 1)).toBe('2026-02-28');
  });

  it('monthly: clamps Jan 31 to Feb 29 on leap year', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2028-01-31', 1)).toBe('2028-02-29');
  });

  it('monthly: clamps 31 to 30 on April', () => {
    expect(computeDueDateForPeriodIndex('monthly', '2026-03-31', 1)).toBe('2026-04-30');
  });

  it('yearly: index 0 returns start_date', () => {
    expect(computeDueDateForPeriodIndex('yearly', '2026-05-20', 0)).toBe('2026-05-20');
  });

  it('yearly: index 1 returns next year same date', () => {
    expect(computeDueDateForPeriodIndex('yearly', '2026-05-20', 1)).toBe('2027-05-20');
  });

  it('yearly: clamps Feb 29 to Feb 28 on non-leap year', () => {
    expect(computeDueDateForPeriodIndex('yearly', '2028-02-29', 1)).toBe('2029-02-28');
  });
});
