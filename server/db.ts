import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES, SEED_CATEGORIES } from './schema.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'finances.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

migrate(db);

db.exec(CREATE_TABLES);
db.exec(SEED_CATEGORIES);

function migrate(database: Database.Database) {
  const version = database.pragma('user_version', { simple: true }) as number;

  if (version < 1) {
    database.pragma('foreign_keys = OFF');

    database.exec(`
      CREATE TABLE IF NOT EXISTS sheets (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        position   INTEGER NOT NULL DEFAULT 0,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      INSERT OR IGNORE INTO sheets (id, name, position) VALUES (1, 'General', 0);
    `);

    const hasSheetId = database
      .prepare('PRAGMA table_info(expenses)')
      .all()
      .some((col: unknown) => (col as { name: string }).name === 'sheet_id');

    if (!hasSheetId) {
      database.exec(`
        ALTER TABLE expenses ADD COLUMN sheet_id INTEGER NOT NULL DEFAULT 1;
      `);
    }

    database.pragma('foreign_keys = ON');
    database.pragma('user_version = 1');
  }
}

export default db;
