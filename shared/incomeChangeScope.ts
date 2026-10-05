/**
 * Whether a new amount on an income line applies to the visible month only or
 * from that month onwards. The UI asks the user ("¿solo este mes, o a partir de
 * ahora?") instead of exposing validity intervals.
 *
 * This is a parameter of the update operation, never a stored column:
 * `income_lines` holds only intervals, and the line type is derived from them.
 */
export const IncomeChangeScope = {
  ThisMonth: 'this-month',
  FromNowOn: 'from-now-on',
} as const;

export type IncomeChangeScope =
  (typeof IncomeChangeScope)[keyof typeof IncomeChangeScope];
