import { Router } from 'express';
import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';
import type {
  ExpenseRow,
  ExpenseWithCategoryRow,
  CreateExpenseBody,
  UpdateExpenseBody,
  DuplicateExpenseBody,
} from '../types.ts';

const router = Router();

router.get('/', (req, res) => {
  const month = req.query.month as string | undefined;
  const sheetId = req.query.sheetId as string | undefined;

  if (sheetId && !hasSheetAccess(db, Number(sheetId), req.userId, 'read')) {
    res.status(403).json({ error: 'No autorizado' });
    return;
  }

  let sql = `
    SELECT e.*, c.name AS category_name, c.color AS category_color
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
  `;
  const params: (string | number)[] = [];

  if (sheetId) {
    sql += ' WHERE e.sheet_id = ?';
    params.push(sheetId);
  } else {
    sql += ' WHERE e.user_id = ?';
    params.push(req.userId);
  }

  if (month) {
    sql += ` AND e.date LIKE ? || '%'`;
    params.push(month);
  }

  sql += ' ORDER BY e.date DESC, e.id DESC';

  const rows = db.prepare(sql).all(...params) as ExpenseWithCategoryRow[];
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const { amount, description, date, categoryId, sheetId } = req.body as CreateExpenseBody;

    if (!amount || !date || !categoryId || !sheetId) {
      res.status(400).json({ error: 'Importe, fecha, categoría y hoja son obligatorios' });
      return;
    }

    if (!hasSheetAccess(db, sheetId, req.userId, 'edit')) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    const stmt = db.prepare(
      'INSERT INTO expenses (amount, description, date, category_id, sheet_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const result = stmt.run(amount, description ?? '', date, categoryId, sheetId, req.userId);

    const row = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(result.lastInsertRowid) as ExpenseRow;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateExpenseBody & { scope?: 'this' | 'future' };
    const { amount, description, date, categoryId, sheetId, scope } = body;

    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(id) as ExpenseRow | undefined;
    if (!existing || !hasSheetAccess(db, existing.sheet_id, req.userId, 'edit')) {
      res.status(404).json({ error: 'Gasto no encontrado' });
      return;
    }

    if (sheetId !== undefined && sheetId !== existing.sheet_id) {
      if (!hasSheetAccess(db, sheetId, req.userId, 'edit')) {
        res.status(403).json({ error: 'Sin permiso en la hoja destino' });
        return;
      }
    }

    const futureScope =
      scope === 'future' && existing.recurring_id !== null && existing.user_id === req.userId;

    db.transaction(() => {
      db.prepare(
        'UPDATE expenses SET amount = ?, description = ?, date = ?, category_id = ?, sheet_id = ? WHERE id = ?',
      ).run(
        amount ?? existing.amount,
        description ?? existing.description,
        date ?? existing.date,
        categoryId ?? existing.category_id,
        sheetId ?? existing.sheet_id,
        id,
      );

      if (futureScope) {
        db.prepare(
          `UPDATE expenses
           SET amount = ?, description = ?, category_id = ?
           WHERE recurring_id = ? AND date > ? AND id != ?`,
        ).run(
          amount ?? existing.amount,
          description ?? existing.description,
          categoryId ?? existing.category_id,
          existing.recurring_id,
          existing.date,
          id,
        );
        db.prepare(
          'UPDATE recurring_expenses SET amount = ?, description = ?, category_id = ? WHERE id = ?',
        ).run(
          amount ?? existing.amount,
          description ?? existing.description,
          categoryId ?? existing.category_id,
          existing.recurring_id,
        );
      }
    })();

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const scope = req.query.scope === 'future' ? 'future' : 'this';

    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(id) as ExpenseRow | undefined;
    if (!existing || !hasSheetAccess(db, existing.sheet_id, req.userId, 'edit')) {
      res.status(404).json({ error: 'Gasto no encontrado' });
      return;
    }

    const futureScope =
      scope === 'future' && existing.recurring_id !== null && existing.user_id === req.userId;

    db.transaction(() => {
      if (futureScope) {
        db.prepare(
          'DELETE FROM expenses WHERE recurring_id = ? AND date >= ?',
        ).run(existing.recurring_id, existing.date);
        db.prepare('DELETE FROM recurring_expenses WHERE id = ?').run(existing.recurring_id);
      } else {
        db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      }
    })();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/duplicate', (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetSheetId, date } = req.body as DuplicateExpenseBody;

    if (!targetSheetId || !date) {
      res.status(400).json({ error: 'targetSheetId y date son obligatorios' });
      return;
    }

    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(id) as ExpenseRow | undefined;
    if (!existing || !hasSheetAccess(db, existing.sheet_id, req.userId, 'edit')) {
      res.status(404).json({ error: 'Gasto no encontrado' });
      return;
    }

    if (!hasSheetAccess(db, targetSheetId, req.userId, 'edit')) {
      res.status(403).json({ error: 'Sin permiso en la hoja destino' });
      return;
    }

    const result = db
      .prepare(
        'INSERT INTO expenses (amount, description, date, category_id, sheet_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        existing.amount,
        existing.description,
        date,
        existing.category_id,
        targetSheetId,
        req.userId,
      );

    const row = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(result.lastInsertRowid) as ExpenseRow;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

export default router;
