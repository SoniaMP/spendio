/**
 * The recurrence choice offered when creating an income line. It maps onto the
 * stored interval rather than being persisted: `Recurring` leaves `end_month`
 * open, `SingleMonth` closes it on the start month.
 */
export const IncomeRecurrence = {
  Recurring: 'recurring',
  SingleMonth: 'single-month',
} as const;

export type IncomeRecurrence =
  (typeof IncomeRecurrence)[keyof typeof IncomeRecurrence];
