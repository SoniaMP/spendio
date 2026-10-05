import type { IncomeLineRow } from '../types.ts';

/**
 * A month's income figure: the plain sum of the lines in force for it.
 *
 * Lines are **additive and have no precedence** — a single-month line adds to
 * the recurring ones instead of overriding them. That is the whole rule, and
 * keeping it as a named function is what stops a future "the exceptional line
 * should win" from creeping in unnoticed.
 *
 * Takes rows rather than a database handle so the caller can reuse the same
 * `listIncomeLinesForMonth` result for both the figure and the line list.
 */
export function resolveMonthlyIncome(lines: IncomeLineRow[]): number {
  return lines.reduce((total, line) => total + line.amount, 0);
}
