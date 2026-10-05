import { Router } from 'express';
import { ErrorCode } from '../../shared/errorCodes.ts';
import db from '../db.ts';
import { isValidMonthKey, previousMonthKey } from '../helpers/monthKeys.ts';
import type { CreateIncomeLineBody, IncomeLineRow } from '../types.ts';

const router = Router();

function findOwn(id: number, userId: number): IncomeLineRow | undefined {
  const row = db
    .prepare('SELECT * FROM income_lines WHERE id = ?')
    .get(id) as IncomeLineRow | undefined;
  if (!row || row.user_id !== userId) return undefined;
  return row;
}

function validateMonth(month: string | undefined): string | null {
  if (!month) return ErrorCode.MissingMonth;
  if (!isValidMonthKey(month)) return ErrorCode.InvalidMonthFormat;
  return null;
}

router.post('/', (req, res, next) => {
  try {
    const { label, amount, month, isRecurring } = req.body as CreateIncomeLineBody;

    const monthError = validateMonth(month);
    if (monthError) {
      res.status(400).json({ error: monthError });
      return;
    }

    if (typeof label !== 'string' || label.trim() === '') {
      res.status(400).json({ error: ErrorCode.IncomeLabelRequired });
      return;
    }

    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: ErrorCode.AmountMustBePositive });
      return;
    }

    // Demanded explicitly rather than defaulted: a missing flag would quietly
    // create a single-month line for someone who meant a salary.
    if (typeof isRecurring !== 'boolean') {
      res.status(400).json({ error: ErrorCode.IncomeRecurrenceRequired });
      return;
    }

    // A recurring line stays open; a single-month one ends where it starts. The
    // line type is derived from the interval, never stored.
    const endMonth = isRecurring ? null : month;

    const result = db
      .prepare(
        `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(req.userId, label.trim(), amount, month, endMonth);

    const row = db
      .prepare('SELECT * FROM income_lines WHERE id = ?')
      .get(result.lastInsertRowid) as IncomeLineRow;

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

/**
 * Cancels a line from the given month onwards by closing its interval at the
 * previous month, so every closed month keeps counting it (UC-INC-05).
 *
 * Two cases cannot be closed and are deleted outright: a single-month line,
 * which has no history to preserve, and a line whose interval would end before
 * it starts — cancelling in the very month a line begins means it never applied
 * to anything.
 */
router.delete('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const month = req.query.month as string | undefined;

    const monthError = validateMonth(month);
    if (monthError) {
      res.status(400).json({ error: monthError });
      return;
    }

    const line = findOwn(id, req.userId);
    if (!line) {
      res.status(404).json({ error: ErrorCode.IncomeLineNotFound });
      return;
    }

    const newEndMonth = previousMonthKey(month as string);
    const isSingleMonth = line.end_month === line.start_month;

    if (isSingleMonth || newEndMonth < line.start_month) {
      db.prepare('DELETE FROM income_lines WHERE id = ?').run(id);
      res.json({ success: true });
      return;
    }

    // Already closed before the requested month: nothing to cancel.
    if (line.end_month !== null && line.end_month <= newEndMonth) {
      res.json({ success: true });
      return;
    }

    db.prepare('UPDATE income_lines SET end_month = ? WHERE id = ?').run(newEndMonth, id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
