import { Router } from 'express';
import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';
import type {
  ExpenseRow,
  ExpenseWithCategoryRow,
  CreateExpenseBody,
  UpdateExpenseBody,
} from '../types.ts';

const router = Router();

router.get('/', (req, res) => {
  const month = req.query.month as string | undefined;
  const sheetId = req.query.sheetId as string | undefined;

  if (sheetId && !hasSheetAccess(db, Number(sheetId), req.userId, 'read')) {
    res.status(403).json({ error: 'Not authorized' });
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
      res.status(400).json({ error: 'amount, date, categoryId, and sheetId are required' });
      return;
    }

    if (!hasSheetAccess(db, sheetId, req.userId, 'edit')) {
      res.status(403).json({ error: 'Not authorized' });
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
    const { amount, description, date, categoryId } = req.body as UpdateExpenseBody;

    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(id) as ExpenseRow | undefined;
    if (!existing || !hasSheetAccess(db, existing.sheet_id, req.userId, 'edit')) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    db.prepare(
      'UPDATE expenses SET amount = ?, description = ?, date = ?, category_id = ? WHERE id = ?',
    ).run(
      amount ?? existing.amount,
      description ?? existing.description,
      date ?? existing.date,
      categoryId ?? existing.category_id,
      id,
    );

    const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRow;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = db
      .prepare('SELECT * FROM expenses WHERE id = ?')
      .get(id) as ExpenseRow | undefined;
    if (!existing || !hasSheetAccess(db, existing.sheet_id, req.userId, 'edit')) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
