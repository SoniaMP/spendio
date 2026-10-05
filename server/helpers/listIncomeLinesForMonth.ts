import type Database from 'better-sqlite3';
import type { IncomeLineRow } from '../types.ts';

/**
 * Income lines in force for a month, i.e. whose validity interval covers it.
 * Months are `'YYYY-MM'`, so the comparisons are plain string comparisons and
 * the `(user_id, start_month)` index applies.
 *
 * This is the only place the "in force" rule is expressed in SQL. Callers that
 * need the month's figure sum these rows with `resolveMonthlyIncome`, so a
 * request never queries twice for the same thing.
 */
export function listIncomeLinesForMonth(
  db: Database.Database,
  userId: number,
  monthKey: string,
): IncomeLineRow[] {
  return db
    .prepare(
      `SELECT * FROM income_lines
       WHERE user_id = ?
         AND start_month <= ?
         AND (end_month IS NULL OR end_month >= ?)
       ORDER BY start_month, id`,
    )
    .all(userId, monthKey, monthKey) as IncomeLineRow[];
}
