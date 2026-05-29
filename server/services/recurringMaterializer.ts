import db from '../db.ts';
import { computeDueDateForPeriodIndex } from '../helpers/computeDueDate.ts';
import {
  horizonTargetDate,
  lastPeriodIndexUpTo,
  firstPeriodIndexOnOrAfter,
  addDaysIso,
} from '../helpers/recurringPeriods.ts';
import type { RecurringExpenseRow } from '../types.ts';

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function computeDesiredMaxIndex(
  template: RecurringExpenseRow,
  today: string,
): number {
  const horizonTarget = horizonTargetDate(template.period, today);
  let desired = lastPeriodIndexUpTo(template.period, template.start_date, horizonTarget);
  if (template.end_date) {
    const endIndex = lastPeriodIndexUpTo(
      template.period,
      template.start_date,
      template.end_date,
    );
    desired = Math.min(desired, endIndex);
  }
  return desired;
}

export function computeInitialNotifiedIndex(
  period: RecurringExpenseRow['period'],
  startDate: string,
  noticeDays: number,
  today: string,
): number {
  const cutoff = addDaysIso(today, noticeDays);
  return lastPeriodIndexUpTo(period, startDate, cutoff);
}

export function deleteFutureMaterialized(templateId: number, today: string): void {
  db.prepare('DELETE FROM expenses WHERE recurring_id = ? AND date > ?').run(templateId, today);
}

export function updateFutureMaterialized(
  template: RecurringExpenseRow,
  today: string,
): void {
  db.prepare(
    `UPDATE expenses
     SET amount = ?, description = ?, category_id = ?
     WHERE recurring_id = ? AND date >= ?`,
  ).run(template.amount, template.description, template.category_id, template.id, today);
}

export function materializeRange(
  template: RecurringExpenseRow,
  fromIndex: number,
  toIndex: number,
): void {
  if (fromIndex > toIndex) return;
  const stmt = db.prepare(
    `INSERT INTO expenses (amount, description, date, category_id, sheet_id, user_id, recurring_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (let i = fromIndex; i <= toIndex; i++) {
    const due = computeDueDateForPeriodIndex(template.period, template.start_date, i);
    stmt.run(
      template.amount,
      template.description,
      due,
      template.category_id,
      template.sheet_id,
      template.user_id,
      template.id,
    );
  }
  db.prepare(
    'UPDATE recurring_expenses SET last_generated_period_index = ? WHERE id = ?',
  ).run(toIndex, template.id);
}

interface ApplyUpdateInput {
  amount?: number;
  description?: string;
  categoryId?: number | null;
  period?: RecurringExpenseRow['period'];
  startDate?: string;
  endDate?: string | null;
  noticeDays?: number;
}

export function applyTemplateUpdate(
  existing: RecurringExpenseRow,
  body: ApplyUpdateInput,
  today: string,
): void {
  const newStartDate = body.startDate ?? existing.start_date;
  const newPeriod = body.period ?? existing.period;
  const newNoticeDays = body.noticeDays ?? existing.notice_days;
  const newEndDate = body.endDate === undefined ? existing.end_date : body.endDate;
  const structuralChange =
    body.startDate !== undefined ||
    body.period !== undefined ||
    body.endDate !== undefined;

  let nextGenerated = existing.last_generated_period_index;
  let nextNotified = existing.last_notified_period_index;

  if (structuralChange) {
    deleteFutureMaterialized(existing.id, today);
    nextGenerated = -1;
    nextNotified = computeInitialNotifiedIndex(
      newPeriod,
      newStartDate,
      newNoticeDays,
      today,
    );
  }

  db.prepare(
    `UPDATE recurring_expenses
     SET amount = ?, description = ?, category_id = ?, period = ?,
         start_date = ?, end_date = ?, notice_days = ?,
         last_generated_period_index = ?, last_notified_period_index = ?
     WHERE id = ?`,
  ).run(
    body.amount ?? existing.amount,
    body.description ?? existing.description,
    body.categoryId === undefined ? existing.category_id : body.categoryId,
    newPeriod,
    newStartDate,
    newEndDate,
    newNoticeDays,
    nextGenerated,
    nextNotified,
    existing.id,
  );

  const refreshed = db
    .prepare('SELECT * FROM recurring_expenses WHERE id = ?')
    .get(existing.id) as RecurringExpenseRow;
  if (structuralChange) {
    materializeHorizon(refreshed, today);
  } else {
    updateFutureMaterialized(refreshed, today);
  }
}

export function materializeHorizon(
  template: RecurringExpenseRow,
  today: string,
): void {
  const desiredMax = computeDesiredMaxIndex(template, today);
  if (desiredMax < 0) return;

  let startIndex = template.last_generated_period_index + 1;
  const firstOnOrAfterToday = firstPeriodIndexOnOrAfter(
    template.period,
    template.start_date,
    today,
  );
  if (firstOnOrAfterToday > startIndex) {
    startIndex = firstOnOrAfterToday;
  }

  if (startIndex > desiredMax) return;
  materializeRange(template, startIndex, desiredMax);
}
