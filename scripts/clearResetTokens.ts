import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(import.meta.dirname, '..', 'data', 'finances.db');
const db = new Database(DB_PATH);

const userId = process.argv[2] ? Number(process.argv[2]) : null;

if (userId) {
  const result = db
    .prepare('DELETE FROM password_reset_tokens WHERE user_id = ?')
    .run(userId);
  console.log(`Eliminados ${result.changes} tokens del usuario ${userId}`);
} else {
  const result = db
    .prepare('DELETE FROM password_reset_tokens')
    .run();
  console.log(`Eliminados ${result.changes} tokens en total`);
}

db.close();
