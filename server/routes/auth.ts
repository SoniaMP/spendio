import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import db from '../db.ts';
import { seedCategoriesForUser } from '../db.ts';
import type { UserRow } from '../types.ts';

const router = Router();
const client = new OAuth2Client();

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body as { credential: string };

    if (!credential) {
      res.status(400).json({ error: 'credential is required' });
      return;
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ error: 'Google Client ID not configured' });
      return;
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      res.status(401).json({ error: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = db
      .prepare('SELECT * FROM users WHERE google_id = ?')
      .get(googleId) as UserRow | undefined;

    if (!user) {
      const invited = db
        .prepare("SELECT * FROM users WHERE email = ? AND google_id LIKE '__invited_%'")
        .get(email) as UserRow | undefined;

      if (invited) {
        db.prepare(
          'UPDATE users SET google_id = ?, name = ?, picture = ?, updated_at = datetime(\'now\') WHERE id = ?',
        ).run(googleId, name ?? '', picture ?? '', invited.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(invited.id) as UserRow;
      } else {
        const result = db
          .prepare('INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)')
          .run(googleId, email, name ?? '', picture ?? '');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;

        seedCategoriesForUser(user.id);

        const maxPos = db
          .prepare('SELECT COALESCE(MAX(position), -1) AS mp FROM sheets WHERE user_id = ?')
          .get(user.id) as { mp: number };
        if (maxPos.mp < 0) {
          db.prepare('INSERT INTO sheets (name, position, user_id) VALUES (?, ?, ?)').run(
            'General',
            0,
            user.id,
          );
        }
      }
    } else {
      db.prepare(
        'UPDATE users SET email = ?, name = ?, picture = ?, updated_at = datetime(\'now\') WHERE id = ?',
      ).run(email, name ?? '', picture ?? '', user.id);
    }

    req.session.userId = user.id;
    res.json({
      id: user.id,
      email: user.email,
      name: name ?? user.name,
      picture: picture ?? user.picture,
    });
  } catch (err) {
    console.error('Google auth error:', err);
    next(err);
  }
});

const DEV_USERS = {
  dev1: { googleId: '__dev_user_1__', email: 'dev1@spendio.local', name: 'Dev 1' },
  dev2: { googleId: '__dev_user_2__', email: 'dev2@spendio.local', name: 'Dev 2' },
} as const;

router.post('/dev-login', (req, res) => {
  if (process.env.VITE_AUTH_BYPASS !== 'true') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const devUser = (req.body as { devUser?: string })?.devUser === 'dev2' ? 'dev2' : 'dev1';
  const config = DEV_USERS[devUser];

  // Migrate old __dev_user__ to __dev_user_1__
  const oldDev = db
    .prepare('SELECT * FROM users WHERE google_id = ?')
    .get('__dev_user__') as UserRow | undefined;
  if (oldDev) {
    db.prepare(
      "UPDATE users SET google_id = ?, email = ?, name = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(DEV_USERS.dev1.googleId, DEV_USERS.dev1.email, DEV_USERS.dev1.name, oldDev.id);
  }

  let user = db
    .prepare('SELECT * FROM users WHERE google_id = ?')
    .get(config.googleId) as UserRow | undefined;

  if (!user) {
    const existingByEmail = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(config.email) as UserRow | undefined;

    if (existingByEmail) {
      db.prepare(
        "UPDATE users SET google_id = ?, name = ?, updated_at = datetime('now') WHERE id = ?",
      ).run(config.googleId, config.name, existingByEmail.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingByEmail.id) as UserRow;
    } else {
      const result = db
        .prepare('INSERT INTO users (google_id, email, name, picture) VALUES (?, ?, ?, ?)')
        .run(config.googleId, config.email, config.name, '');
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
      seedCategoriesForUser(user.id);
      db.prepare('INSERT INTO sheets (name, position, user_id) VALUES (?, ?, ?)').run(
        'General',
        0,
        user.id,
      );
    }
  }

  req.session.userId = user.id;
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
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

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export default router;
