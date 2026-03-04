import { Router } from 'express';
import db from '../db.ts';
import type { CategoryRow, CreateCategoryBody, UpdateCategoryBody } from '../types.ts';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY id').all() as CategoryRow[];
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const { name, color } = req.body as CreateCategoryBody;

    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const stmt = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
    const result = stmt.run(name.trim(), color ?? '#6B7280');

    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as CategoryRow;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body as UpdateCategoryBody;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updatedName = name?.trim() ?? existing.name;
    const updatedColor = color ?? existing.color;

    db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(updatedName, updatedColor, id);

    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;

    const hasExpenses = db.prepare('SELECT 1 FROM expenses WHERE category_id = ? LIMIT 1').get(id);
    if (hasExpenses) {
      res.status(409).json({ error: 'Category has expenses and cannot be deleted' });
      return;
    }

    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
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
