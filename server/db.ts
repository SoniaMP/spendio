import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { CREATE_TABLES, DEFAULT_CATEGORIES } from './schema.ts';

const DATA_DIR = path.resolve(import.meta.dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'finances.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

migrate(db);

db.exec(CREATE_TABLES);

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

  if (version < 2) {
    database.pragma('foreign_keys = OFF');

    database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id  TEXT    UNIQUE NOT NULL,
        email      TEXT    UNIQUE NOT NULL,
        name       TEXT    NOT NULL DEFAULT '',
        picture    TEXT    NOT NULL DEFAULT '',
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);

    database.exec(`
      INSERT OR IGNORE INTO users (id, google_id, email, name)
      VALUES (1, '__placeholder__', 'placeholder@spendio.local', 'Legacy User');
    `);

    const addColumnIfMissing = (table: string, column: string) => {
      const hasColumn = database
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .some((col: unknown) => (col as { name: string }).name === column);
      if (!hasColumn) {
        database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} INTEGER NOT NULL DEFAULT 1;`);
      }
    };

    addColumnIfMissing('categories', 'user_id');
    addColumnIfMissing('sheets', 'user_id');
    addColumnIfMissing('expenses', 'user_id');

    const hasOldUnique = database
      .prepare(`PRAGMA index_list(categories)`)
      .all()
      .some((idx: unknown) => {
        const i = idx as { name: string; unique: number };
        if (!i.unique) return false;
        const cols = database.prepare(`PRAGMA index_info('${i.name}')`).all();
        return cols.length === 1 && (cols[0] as { name: string }).name === 'name';
      });

    if (hasOldUnique) {
      database.exec(`
        CREATE TABLE categories_new (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          name       TEXT    NOT NULL,
          color      TEXT    NOT NULL DEFAULT '#6B7280',
          user_id    INTEGER NOT NULL DEFAULT 1,
          created_at TEXT    NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
          UNIQUE(name, user_id)
        );
        INSERT INTO categories_new (id, name, color, user_id, created_at, updated_at)
          SELECT id, name, color, user_id, created_at, updated_at FROM categories;
        DROP TABLE categories;
        ALTER TABLE categories_new RENAME TO categories;
      `);
    }

    database.pragma('foreign_keys = ON');
    database.pragma('user_version = 2');
  }
}

export function seedCategoriesForUser(userId: number) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO categories (name, color, user_id) VALUES (?, ?, ?)',
  );
  const seedAll = db.transaction(() => {
    for (const cat of DEFAULT_CATEGORIES) {
      insert.run(cat.name, cat.color, userId);
    }
  });
  seedAll();
}

export default db;
