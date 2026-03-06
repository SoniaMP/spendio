import { Router } from 'express';
import db from '../db.ts';
import type { SheetRow, CreateSheetBody, UpdateSheetBody } from '../types.ts';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM sheets ORDER BY position, id')
    .all() as SheetRow[];
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const { name } = req.body as CreateSheetBody;

    if (!name?.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const maxPos = db
      .prepare('SELECT COALESCE(MAX(position), -1) AS mp FROM sheets')
      .get() as { mp: number };

    const result = db
      .prepare('INSERT INTO sheets (name, position) VALUES (?, ?)')
      .run(name.trim(), maxPos.mp + 1);

    const row = db
      .prepare('SELECT * FROM sheets WHERE id = ?')
      .get(result.lastInsertRowid) as SheetRow;
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body as UpdateSheetBody;

    const existing = db
      .prepare('SELECT * FROM sheets WHERE id = ?')
      .get(id) as SheetRow | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Sheet not found' });
      return;
    }

    const updatedName = name?.trim() ?? existing.name;
    db.prepare('UPDATE sheets SET name = ? WHERE id = ?').run(updatedName, id);

    const row = db
      .prepare('SELECT * FROM sheets WHERE id = ?')
      .get(id) as SheetRow;
    res.json(row);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params;

    const count = db
      .prepare('SELECT COUNT(*) AS cnt FROM sheets')
      .get() as { cnt: number };
    if (count.cnt <= 1) {
      res
        .status(409)
        .json({ error: 'Cannot delete the last sheet' });
      return;
    }

    const result = db.prepare('DELETE FROM sheets WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Sheet not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
