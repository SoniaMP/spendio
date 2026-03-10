import session from 'express-session';
import betterSqlite3SessionStore from 'better-sqlite3-session-store';
import db from './db.ts';

const SqliteStore = betterSqlite3SessionStore(session);

export const sessionMiddleware = session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 1000 * 60 * 15 },
  }),
  secret: process.env.SESSION_SECRET ?? 'spendio-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
