import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';
import { computeDueDateForPeriodIndex } from '../helpers/computeDueDate.ts';
import { addDaysIso } from '../helpers/recurringPeriods.ts';
import { materializeHorizon, todayIso } from './recurringMaterializer.ts';
import { sendEmail } from './email.ts';
import { recurringExpenseAlertEmail } from '../templates/recurringExpenseAlert.ts';
import { recurringExpenseDeactivatedEmail } from '../templates/recurringExpenseDeactivated.ts';
import type { RecurringExpenseRow } from '../types.ts';

const APP_BASE_URL = process.env.APP_BASE_URL ?? 'https://spendio.app';

interface UserContact {
  email: string;
  name: string;
}

function fetchUser(userId: number): UserContact | null {
  const row = db
    .prepare('SELECT email, name FROM users WHERE id = ?')
    .get(userId) as UserContact | undefined;
  return row ?? null;
}

function fetchSheetName(sheetId: number): string {
  const row = db
    .prepare('SELECT name FROM sheets WHERE id = ?')
    .get(sheetId) as { name: string } | undefined;
  return row?.name ?? '';
}

async function deactivateAndNotify(template: RecurringExpenseRow) {
  db.prepare('UPDATE recurring_expenses SET is_active = 0 WHERE id = ?').run(template.id);
  const user = fetchUser(template.user_id);
  if (!user) return;
  const { subject, html, text } = recurringExpenseDeactivatedEmail({
    userName: user.name,
    description: template.description,
    sheetName: fetchSheetName(template.sheet_id),
  });
  await sendEmail({ to: user.email, subject, html, text });
}

async function maybeNotifyReminder(template: RecurringExpenseRow, today: string) {
  const targetIndex = template.last_notified_period_index + 1;
  if (targetIndex > template.last_generated_period_index) return;

  const dueDate = computeDueDateForPeriodIndex(
    template.period,
    template.start_date,
    targetIndex,
  );
  if (template.end_date && dueDate > template.end_date) return;

  const triggerDate = addDaysIso(dueDate, -template.notice_days);
  if (today < triggerDate) return;

  const user = fetchUser(template.user_id);
  if (user) {
    const { subject, html, text } = recurringExpenseAlertEmail({
      userName: user.name,
      description: template.description,
      amount: template.amount,
      dueDate,
      sheetUrl: `${APP_BASE_URL}/expenses`,
    });
    await sendEmail({ to: user.email, subject, html, text });
  }
  db.prepare(
    'UPDATE recurring_expenses SET last_notified_period_index = ? WHERE id = ?',
  ).run(targetIndex, template.id);
}

export async function runRecurringGeneration(now: Date = new Date()): Promise<void> {
  const today = todayIso(now);
  const templates = db
    .prepare('SELECT * FROM recurring_expenses WHERE is_active = 1')
    .all() as RecurringExpenseRow[];

  for (const template of templates) {
    if (template.category_id === null) continue;

    if (!hasSheetAccess(db, template.sheet_id, template.user_id, 'edit')) {
      await deactivateAndNotify(template);
      continue;
    }

    materializeHorizon(template, today);

    const refreshed = db
      .prepare('SELECT * FROM recurring_expenses WHERE id = ?')
      .get(template.id) as RecurringExpenseRow | undefined;
    if (!refreshed) continue;

    await maybeNotifyReminder(refreshed, today);
  }
}
