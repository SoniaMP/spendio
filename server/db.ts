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

db.exec(CREATE_TABLES);

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
