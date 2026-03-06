import { Router } from 'express';
import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';
import type { SheetRow, CreateSheetBody, UpdateSheetBody } from '../types.ts';

const router = Router();

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*, 'owner' AS permission, NULL AS shared_by_name,
              EXISTS(SELECT 1 FROM sheet_shares WHERE sheet_id = s.id) AS has_shares
       FROM sheets s WHERE s.user_id = ?
       UNION ALL
       SELECT s.*, ss.permission, u.name AS shared_by_name, 0 AS has_shares
       FROM sheet_shares ss
       JOIN sheets s ON s.id = ss.sheet_id
       JOIN users u ON u.id = ss.shared_by_user_id
       WHERE ss.shared_with_user_id = ?
       ORDER BY position, id`,
    )
    .all(req.userId, req.userId);
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
      .prepare('SELECT COALESCE(MAX(position), -1) AS mp FROM sheets WHERE user_id = ?')
      .get(req.userId) as { mp: number };

    const result = db
      .prepare('INSERT INTO sheets (name, position, user_id) VALUES (?, ?, ?)')
      .run(name.trim(), maxPos.mp + 1, req.userId);

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
    if (!existing || !hasSheetAccess(db, existing.id, req.userId, 'edit')) {
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
      .prepare('SELECT COUNT(*) AS cnt FROM sheets WHERE user_id = ?')
      .get(req.userId) as { cnt: number };
    if (count.cnt <= 1) {
      res
        .status(409)
        .json({ error: 'Cannot delete the last sheet' });
      return;
    }

    const result = db
      .prepare('DELETE FROM sheets WHERE id = ? AND user_id = ?')
      .run(id, req.userId);
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
