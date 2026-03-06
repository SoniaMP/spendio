import { Router } from 'express';
import db from '../db.ts';
import type { CategoryRow, CreateCategoryBody, UpdateCategoryBody } from '../types.ts';

const router = Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY id')
    .all(req.userId) as CategoryRow[];
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const { name, color } = req.body as CreateCategoryBody;

    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const stmt = db.prepare(
      'INSERT INTO categories (name, color, user_id) VALUES (?, ?, ?)',
    );
    const result = stmt.run(name.trim(), color ?? '#6B7280', req.userId);

    const row = db
      .prepare('SELECT * FROM categories WHERE id = ?')
      .get(result.lastInsertRowid) as CategoryRow;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body as UpdateCategoryBody;

    const existing = db
      .prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
      .get(id, req.userId) as CategoryRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updatedName = name?.trim() ?? existing.name;
    const updatedColor = color ?? existing.color;

    db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ? AND user_id = ?').run(
      updatedName,
      updatedColor,
      id,
      req.userId,
    );

    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;

    const hasExpenses = db
      .prepare('SELECT 1 FROM expenses WHERE category_id = ? AND user_id = ? LIMIT 1')
      .get(id, req.userId);
    if (hasExpenses) {
      res.status(409).json({ error: 'Category has expenses and cannot be deleted' });
      return;
    }

    const result = db
      .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
      .run(id, req.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
