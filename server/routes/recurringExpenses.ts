import { Router } from 'express';
import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';
import {
  todayIso,
  materializeHorizon,
  deleteFutureMaterialized,
  computeInitialNotifiedIndex,
  applyTemplateUpdate,
} from '../services/recurringMaterializer.ts';
import type {
  RecurringExpenseRow,
  RecurringPeriod,
  CreateRecurringExpenseBody,
  UpdateRecurringExpenseBody,
  ToggleRecurringExpenseBody,
} from '../types.ts';

const router = Router();

const ALLOWED_PERIODS: RecurringPeriod[] = ['monthly', 'yearly'];

function validateMutableFields(
  body: UpdateRecurringExpenseBody,
  existing?: RecurringExpenseRow,
): string | null {
  if (body.amount !== undefined && body.amount <= 0) return 'Importe debe ser mayor que 0';
  if (body.period !== undefined && !ALLOWED_PERIODS.includes(body.period)) {
    return 'Periodo debe ser mensual o anual';
  }
  if (body.startDate !== undefined && body.startDate < todayIso()) {
    return 'La fecha de inicio no puede ser anterior a hoy';
  }
  if (body.noticeDays !== undefined && body.noticeDays < 0) {
    return 'Días de aviso no pueden ser negativos';
  }
  const startDate = body.startDate ?? existing?.start_date;
  const endDate = body.endDate === undefined ? existing?.end_date : body.endDate;
  if (endDate && startDate && endDate < startDate) {
    return 'La fecha de fin no puede ser anterior al inicio';
  }
  return null;
}

function findOwn(id: number, userId: number): RecurringExpenseRow | undefined {
  const row = db
    .prepare('SELECT * FROM recurring_expenses WHERE id = ?')
    .get(id) as RecurringExpenseRow | undefined;
  if (!row || row.user_id !== userId) return undefined;
  return row;
}

function selectTemplate(id: number | bigint): RecurringExpenseRow {
  return db
    .prepare('SELECT * FROM recurring_expenses WHERE id = ?')
    .get(id) as RecurringExpenseRow;
}

router.get('/', (req, res) => {
  const sheetId = req.query.sheetId ? Number(req.query.sheetId) : null;
  if (sheetId !== null && !hasSheetAccess(db, sheetId, req.userId, 'read')) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }
  const sql = sheetId
    ? 'SELECT * FROM recurring_expenses WHERE sheet_id = ? AND user_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM recurring_expenses WHERE user_id = ? ORDER BY created_at DESC';
  const params = sheetId ? [sheetId, req.userId] : [req.userId];
  const rows = db.prepare(sql).all(...params) as RecurringExpenseRow[];
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const body = req.body as CreateRecurringExpenseBody & { sheetId: number };
    if (!body.amount || !body.categoryId || !body.period || !body.startDate || !body.sheetId) {
      res.status(400).json({
        error: 'Importe, categoría, periodo, fecha de inicio y hoja son obligatorios',
      });
      return;
    }
    const validationError = validateMutableFields(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    if (!hasSheetAccess(db, body.sheetId, req.userId, 'edit')) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    const description = body.description ?? '';
    const noticeDays = body.noticeDays ?? 3;
    const today = todayIso();
    const initialNotified = computeInitialNotifiedIndex(
      body.period,
      body.startDate,
      noticeDays,
      today,
    );

    const templateId = db.transaction(() => {
      const created = db
        .prepare(
          `INSERT INTO recurring_expenses
           (user_id, sheet_id, category_id, amount, description, period,
            start_date, end_date, notice_days, last_notified_period_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          req.userId,
          body.sheetId,
          body.categoryId,
          body.amount,
          description,
          body.period,
          body.startDate,
          body.endDate ?? null,
          noticeDays,
          initialNotified,
        );
      const template = selectTemplate(created.lastInsertRowid);
      materializeHorizon(template, today);
      return created.lastInsertRowid;
    })();

    res.status(201).json(selectTemplate(templateId));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = findOwn(id, req.userId);
    if (!existing) {
      res.status(404).json({ error: 'Recurrente no encontrado' });
      return;
    }
    const body = req.body as UpdateRecurringExpenseBody;
    const validationError = validateMutableFields(body, existing);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }
    db.transaction(() => applyTemplateUpdate(existing, body, todayIso()))();
    res.json(selectTemplate(id));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/active', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body as ToggleRecurringExpenseBody;
    if (typeof isActive !== 'boolean') {
      res.status(400).json({ error: 'isActive debe ser boolean' });
      return;
    }
    const existing = findOwn(id, req.userId);
    if (!existing) {
      res.status(404).json({ error: 'Recurrente no encontrado' });
      return;
    }
    const today = todayIso();

    db.transaction(() => {
      db.prepare('UPDATE recurring_expenses SET is_active = ? WHERE id = ?').run(
        isActive ? 1 : 0,
        id,
      );
      if (isActive) {
        const refreshed = selectTemplate(id);
        materializeHorizon(refreshed, today);
      } else {
        deleteFutureMaterialized(id, today);
      }
    })();

    res.json(selectTemplate(id));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!findOwn(id, req.userId)) {
      res.status(404).json({ error: 'Recurrente no encontrado' });
      return;
    }
    const today = todayIso();

    db.transaction(() => {
      deleteFutureMaterialized(id, today);
      db.prepare('DELETE FROM recurring_expenses WHERE id = ?').run(id);
    })();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
