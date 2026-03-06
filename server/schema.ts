export const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    UNIQUE NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#6B7280',
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sheets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    amount      REAL    NOT NULL CHECK (amount > 0),
    description TEXT    NOT NULL DEFAULT '',
    date        TEXT    NOT NULL DEFAULT (date('now')),
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sheet_id    INTEGER NOT NULL DEFAULT 1 REFERENCES sheets(id) ON DELETE CASCADE,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date
    ON expenses(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category_id
    ON expenses(category_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_sheet_id
    ON expenses(sheet_id);

  CREATE TRIGGER IF NOT EXISTS categories_updated_at
    AFTER UPDATE ON categories
    FOR EACH ROW
    BEGIN
      UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

  CREATE TRIGGER IF NOT EXISTS sheets_updated_at
    AFTER UPDATE ON sheets
    FOR EACH ROW
    BEGIN
      UPDATE sheets SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

  CREATE TRIGGER IF NOT EXISTS expenses_updated_at
    AFTER UPDATE ON expenses
    FOR EACH ROW
    BEGIN
      UPDATE expenses SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
`;

export const SEED_CATEGORIES = `
  INSERT OR IGNORE INTO categories (name, color) VALUES
    ('Alimentación', '#EF4444'),
    ('Transporte',   '#F97316'),
    ('Vivienda',     '#EAB308'),
    ('Suministros',  '#22C55E'),
    ('Ocio',         '#3B82F6'),
    ('Salud',        '#8B5CF6'),
    ('Educación',    '#EC4899'),
    ('Otros',        '#6B7280');
`;
