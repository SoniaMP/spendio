import { Router } from 'express';
import { ErrorCode } from '../../shared/errorCodes.ts';
import db from '../db.ts';
import { isValidMonthKey } from '../helpers/monthKeys.ts';
import { listIncomeLinesForMonth } from '../helpers/listIncomeLinesForMonth.ts';
import { resolveMonthlyIncome } from '../helpers/resolveMonthlyIncome.ts';
import type { MonthlyIncomeResponse } from '../types.ts';

const router = Router();

/**
 * What the actor spent in a month, across every sheet — their own and the ones
 * shared with them. The filter is `user_id`, so another user's expenses on a
 * shared sheet never consume the actor's income. Income is not sheet-scoped,
 * which is why no permission check happens anywhere in this route.
 */
function spentInMonth(userId: number, monthKey: string): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE user_id = ? AND date LIKE ? || '%'`,
    )
    .get(userId, monthKey) as { total: number };
  return row.total;
}

/** Amounts are REAL, so the subtraction needs rounding: a leftover like
 *  -0.0000000001 would otherwise render as a negative remaining. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

router.get('/', (req, res) => {
  const month = req.query.month as string | undefined;

  if (!month) {
    res.status(400).json({ error: ErrorCode.MissingMonth });
    return;
  }

  if (!isValidMonthKey(month)) {
    res.status(400).json({ error: ErrorCode.InvalidMonthFormat });
    return;
  }

  const lines = listIncomeLinesForMonth(db, req.userId, month);
  const amount = toCents(resolveMonthlyIncome(lines));
  const spent = toCents(spentInMonth(req.userId, month));

  const response: MonthlyIncomeResponse = {
    amount,
    spent,
    remaining: toCents(amount - spent),
    lines,
  };

  res.json(response);
});

export default router;
