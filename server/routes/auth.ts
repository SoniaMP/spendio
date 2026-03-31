import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import db from '../db.ts';
import { seedCategoriesForUser } from '../db.ts';
import { sendEmail } from '../services/email.ts';
import { passwordResetEmail } from '../templates/passwordReset.ts';
import { accountActivationEmail } from '../templates/accountActivation.ts';
import type { UserRow } from '../types.ts';

const router = Router();
const SALT_ROUNDS = 10;
const TOKEN_TTL_MINUTES = 30;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MINUTES = 60;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, contraseña y nombre son obligatorios' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as
      | { id: number }
      | undefined;

    if (existing) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = db
      .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(normalizedEmail, name, passwordHash);

    const user = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid) as UserRow;

    seedCategoriesForUser(user.id);

    db.prepare('INSERT INTO sheets (name, position, user_id) VALUES (?, ?, ?)').run(
      'General',
      0,
      user.id,
    );

    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
      | UserRow
      | undefined;

    if (!user?.password_hash) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
  } catch (err) {
    next(err);
  }
});

router.get('/me', (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as
    | UserRow
    | undefined;

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'Usuario no encontrado' });
    return;
  }

  res.json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body as { email?: string };
    const message = 'Si el correo está registrado, recibirás un enlace de recuperación en breve.';

    if (!email) {
      res.json({ message });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
      | UserRow
      | undefined;

    if (!user) {
      res.json({ message });
      return;
    }

    const recentCount = (
      db
        .prepare(
          `SELECT COUNT(*) as count FROM password_reset_tokens
           WHERE user_id = ? AND created_at > datetime('now', ?)`,
        )
        .get(user.id, `-${RATE_LIMIT_WINDOW_MINUTES} minutes`) as { count: number }
    ).count;

    if (recentCount >= RATE_LIMIT_MAX) {
      res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' });
      return;
    }

    db.prepare(
      `UPDATE password_reset_tokens SET used_at = datetime('now')
       WHERE user_id = ? AND used_at IS NULL`,
    ).run(user.id);

    db.prepare(
      `DELETE FROM password_reset_tokens
       WHERE user_id = ? AND expires_at < datetime('now')`,
    ).run(user.id);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    ).run(user.id, tokenHash, expiresAt);

    const baseUrl = req.headers.origin ?? `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

    const isStubAccount = !user.password_hash;
    const emailContent = isStubAccount
      ? accountActivationEmail({ resetUrl, userName: user.name })
      : passwordResetEmail({ resetUrl, userName: user.name });

    await sendEmail({ to: user.email, ...emailContent });
    res.json({ message });
  } catch (err) {
    next(err);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || !password) {
      res.status(400).json({ error: 'Token y contraseña son obligatorios' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const row = db
      .prepare(
        `SELECT prt.*, u.id as uid FROM password_reset_tokens prt
         JOIN users u ON u.id = prt.user_id
         WHERE prt.token_hash = ?`,
      )
      .get(tokenHash) as
      | { id: number; user_id: number; expires_at: string; used_at: string | null; uid: number }
      | undefined;

    if (!row) {
      res.status(400).json({ error: 'Enlace de restablecimiento inválido o expirado' });
      return;
    }

    if (row.used_at) {
      res.status(400).json({ error: 'Este enlace ya ha sido utilizado' });
      return;
    }

    if (new Date(row.expires_at) < new Date()) {
      res.status(400).json({ error: 'Este enlace ha expirado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const applyReset = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.user_id);
      db.prepare("UPDATE password_reset_tokens SET used_at = datetime('now') WHERE id = ?").run(
        row.id,
      );
      db.prepare(
        `DELETE FROM password_reset_tokens
         WHERE user_id = ? AND expires_at < datetime('now')`,
      ).run(row.user_id);
    });
    applyReset();

    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    next(err);
  }
});

export default router;
