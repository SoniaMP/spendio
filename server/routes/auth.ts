import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.ts';
import { seedCategoriesForUser } from '../db.ts';
import type { UserRow } from '../types.ts';

const router = Router();
const SALT_ROUNDS = 10;

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: 'email, password and name are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as
      | { id: number }
      | undefined;

    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
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
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
      | UserRow
      | undefined;

    if (!user?.password_hash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
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
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId) as
    | UserRow
    | undefined;

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'User not found' });
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

export default router;
