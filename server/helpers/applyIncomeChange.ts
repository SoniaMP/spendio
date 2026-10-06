import type Database from 'better-sqlite3';
import { previousMonthKey, nextMonthKey } from './monthKeys.ts';
import { IncomeChangeScope } from '../../shared/incomeChangeScope.ts';
import type { IncomeLineRow } from '../types.ts';

/**
 * Changes a line's amount without ever rewriting a closed month.
 *
 * `FromNowOn` is the raise: the current interval is closed the month before, and
 * a fresh one carries the new amount onwards — inheriting the original end, so
 * closing a line in December and raising it in July still ends in December.
 *
 * `ThisMonth` is the exceptional month: the interval is split so the new amount
 * covers exactly that month and the old one resumes after it. That leaves up to
 * three rows where the user sees a single line, which is the price of asking the
 * question instead of forcing every change to be permanent.
 *
 * All branches run in one transaction. The caller must have checked that the
 * line is in force for `month`.
 */
export function applyIncomeChange(
  db: Database.Database,
  line: IncomeLineRow,
  month: string,
  amount: number,
  scope: IncomeChangeScope,
): void {
  const insertSlice = db.prepare(
    `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const setAmount = db.prepare('UPDATE income_lines SET amount = ? WHERE id = ?');
  const closeAt = db.prepare('UPDATE income_lines SET end_month = ? WHERE id = ?');
  const sliceToSingleMonth = db.prepare(
    'UPDATE income_lines SET amount = ?, end_month = ? WHERE id = ?',
  );

  const isSingleMonth = line.end_month === line.start_month;
  const previousAmount = line.amount;

  db.transaction(() => {
    // A single-month line has no history to protect: edit it in place whatever
    // the scope says.
    if (isSingleMonth) {
      setAmount.run(amount, line.id);
      return;
    }

    if (scope === IncomeChangeScope.FromNowOn) {
      // Changing from the line's own first month (or earlier) means the whole
      // line was always meant to be this amount.
      if (month <= line.start_month) {
        setAmount.run(amount, line.id);
        return;
      }
      closeAt.run(previousMonthKey(month), line.id);
      insertSlice.run(line.user_id, line.label, amount, month, line.end_month);
      return;
    }

    const hasMonthsBefore = month > line.start_month;
    const hasMonthsAfter = line.end_month === null || line.end_month > month;

    if (hasMonthsBefore) {
      closeAt.run(previousMonthKey(month), line.id);
      insertSlice.run(line.user_id, line.label, amount, month, month);
    } else {
      // Nothing to preserve before it, so the row itself becomes the slice.
      sliceToSingleMonth.run(amount, month, line.id);
    }

    if (hasMonthsAfter) {
      insertSlice.run(
        line.user_id,
        line.label,
        previousAmount,
        nextMonthKey(month),
        line.end_month,
      );
    }
  })();
}
