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

runMigrations(db);
db.exec(CREATE_TABLES);

function hasColumn(database: Database.Database, table: string, column: string): boolean {
  const cols = database.pragma(`table_info(${table})`) as { name: string }[];
  return cols.some((c) => c.name === column);
}

function tableExists(database: Database.Database, table: string): boolean {
  const row = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
    .get(table) as { 1: number } | undefined;
  return row !== undefined;
}

function runMigrations(database: Database.Database) {
  if (!tableExists(database, 'categories')) return;

  database.pragma('foreign_keys = OFF');

  const migrations: [string, string, string][] = [
    ['categories', 'user_id', 'ALTER TABLE categories ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE'],
    ['sheets', 'user_id', 'ALTER TABLE sheets ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE'],
    ['expenses', 'user_id', 'ALTER TABLE expenses ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE'],
    ['expenses', 'sheet_id', 'ALTER TABLE expenses ADD COLUMN sheet_id INTEGER NOT NULL DEFAULT 1 REFERENCES sheets(id) ON DELETE CASCADE'],
  ];

  for (const [table, column, sql] of migrations) {
    if (tableExists(database, table) && !hasColumn(database, table, column)) {
      database.exec(sql);
    }
  }

  database.pragma('foreign_keys = ON');
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
