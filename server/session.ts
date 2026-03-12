import session from "express-session";
import betterSqlite3SessionStore from "better-sqlite3-session-store";
import db from "./db.ts";

const SqliteStore = betterSqlite3SessionStore(session);

const SESSION_MAX_AGE_MS = 1000 * 60 * 60; // 1 hour

export const sessionMiddleware = session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 1000 * 60 * 15 },
  }),
  secret: process.env.SESSION_SECRET ?? "spendio-dev-secret",
  resave: true,
  rolling: true,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_MS,
  },
});
