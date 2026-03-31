import { Router } from 'express';
import db from '../db.ts';
import type {
  UserRow,
  SheetRow,
  SheetShareRow,
  CreateSheetShareBody,
  UpdateSheetShareBody,
} from '../types.ts';

const router = Router({ mergeParams: true });

router.get('/', (req, res) => {
  const sheetId = Number(req.params.id);
  const sheet = db
    .prepare('SELECT * FROM sheets WHERE id = ? AND user_id = ?')
    .get(sheetId, req.userId) as SheetRow | undefined;
  if (!sheet) {
    res.status(404).json({ error: 'Hoja no encontrada' });
    return;
  }

  const rows = db
    .prepare(
      `SELECT ss.id, ss.sheet_id, ss.permission, ss.created_at,
              u.email, u.name, u.picture
       FROM sheet_shares ss
       JOIN users u ON u.id = ss.shared_with_user_id
       WHERE ss.sheet_id = ?
       ORDER BY ss.created_at`,
    )
    .all(sheetId);
  res.json(rows);
});

router.post('/', (req, res, next) => {
  try {
    const sheetId = Number(req.params.id);
    const { email, permission, confirm } = req.body as CreateSheetShareBody;

    if (!email?.trim() || !['read', 'edit'].includes(permission)) {
      res.status(400).json({ error: 'Email válido y permiso (read|edit) son obligatorios' });
      return;
    }

    const sheet = db
      .prepare('SELECT * FROM sheets WHERE id = ? AND user_id = ?')
      .get(sheetId, req.userId) as SheetRow | undefined;
    if (!sheet) {
      res.status(404).json({ error: 'Hoja no encontrada' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    let targetUser = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(normalizedEmail) as UserRow | undefined;

    if (!targetUser) {
      if (!confirm) {
        res.json({ needsConfirmation: true, email: normalizedEmail });
        return;
      }

      const invitedGoogleId = `__invited_${normalizedEmail}__`;
      const emailName = normalizedEmail.split('@')[0];
      const result = db
        .prepare('INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)')
        .run(invitedGoogleId, normalizedEmail, emailName, '');
      targetUser = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(result.lastInsertRowid) as UserRow;
    }

    if (targetUser.id === req.userId) {
      res.status(400).json({ error: 'No puedes compartir contigo mismo' });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM sheet_shares WHERE sheet_id = ? AND shared_with_user_id = ?')
      .get(sheetId, targetUser.id);
    if (existing) {
      res.status(409).json({ error: 'La hoja ya está compartida con este usuario' });
      return;
    }

    db.prepare(
      'INSERT INTO sheet_shares (sheet_id, shared_by_user_id, shared_with_user_id, permission) VALUES (?, ?, ?, ?)',
    ).run(sheetId, req.userId, targetUser.id, permission);

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.put('/:shareId', (req, res, next) => {
  try {
    const sheetId = Number(req.params.id);
    const shareId = Number(req.params.shareId);
    const { permission } = req.body as UpdateSheetShareBody;

    if (!['read', 'edit'].includes(permission)) {
      res.status(400).json({ error: 'Permiso válido (read|edit) es obligatorio' });
      return;
    }

    const sheet = db
      .prepare('SELECT * FROM sheets WHERE id = ? AND user_id = ?')
      .get(sheetId, req.userId) as SheetRow | undefined;
    if (!sheet) {
      res.status(404).json({ error: 'Hoja no encontrada' });
      return;
    }

    const result = db
      .prepare('UPDATE sheet_shares SET permission = ? WHERE id = ? AND sheet_id = ?')
      .run(permission, shareId, sheetId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Compartición no encontrada' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/leave', (req, res, next) => {
  try {
    const sheetId = Number(req.params.id);
    const result = db
      .prepare('DELETE FROM sheet_shares WHERE sheet_id = ? AND shared_with_user_id = ?')
      .run(sheetId, req.userId);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Compartición no encontrada' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/:shareId', (req, res, next) => {
  try {
    const sheetId = Number(req.params.id);
    const shareId = Number(req.params.shareId);

    const share = db
      .prepare('SELECT * FROM sheet_shares WHERE id = ? AND sheet_id = ?')
      .get(shareId, sheetId) as SheetShareRow | undefined;
    if (!share) {
      res.status(404).json({ error: 'Compartición no encontrada' });
      return;
    }

    const sheet = db
      .prepare('SELECT * FROM sheets WHERE id = ?')
      .get(sheetId) as SheetRow | undefined;

    const isOwner = sheet?.user_id === req.userId;
    const isRecipient = share.shared_with_user_id === req.userId;
    if (!isOwner && !isRecipient) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    db.prepare('DELETE FROM sheet_shares WHERE id = ?').run(shareId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
