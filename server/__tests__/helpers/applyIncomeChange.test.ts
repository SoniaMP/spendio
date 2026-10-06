import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { CREATE_TABLES } from '../../schema.ts';
import { applyIncomeChange } from '../../helpers/applyIncomeChange.ts';
import { listIncomeLinesForMonth } from '../../helpers/listIncomeLinesForMonth.ts';
import { resolveMonthlyIncome } from '../../helpers/resolveMonthlyIncome.ts';
import { IncomeChangeScope } from '../../../shared/incomeChangeScope.ts';
import type { IncomeLineRow } from '../../types.ts';

/**
 * The splitting logic is the only genuinely tricky code in the feature, and an
 * off-by-one on M−1/M+1 stays invisible until someone browses an old month. So
 * every case asserts the figure month by month, against a real database.
 */
const USER = 1;

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(CREATE_TABLES);
  db.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(USER, 'a@spendio.es');
});

function insertLine(amount: number, startMonth: string, endMonth: string | null) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
       VALUES (?, 'Nómina', ?, ?, ?)`,
    )
    .run(USER, amount, startMonth, endMonth);
  return db
    .prepare('SELECT * FROM income_lines WHERE id = ?')
    .get(lastInsertRowid) as IncomeLineRow;
}

function figureAt(month: string): number {
  return resolveMonthlyIncome(listIncomeLinesForMonth(db, USER, month));
}

function rowCount(): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM income_lines').get() as { n: number }).n;
}

describe('applyIncomeChange — FromNowOn (a raise)', () => {
  it('leaves every earlier month on the old amount', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-06', 2200, IncomeChangeScope.FromNowOn);

    expect(figureAt('2026-01')).toBe(1600);
    expect(figureAt('2026-05')).toBe(1600);
    expect(figureAt('2026-06')).toBe(2200);
    expect(figureAt('2027-03')).toBe(2200);
    expect(rowCount()).toBe(2);
  });

  it('inherits the original end instead of reopening the line', () => {
    // A line that was already cancelled in December must still end in December
    // after a raise in July.
    const line = insertLine(1600, '2026-01', '2026-12');

    applyIncomeChange(db, line, '2026-07', 2200, IncomeChangeScope.FromNowOn);

    expect(figureAt('2026-12')).toBe(2200);
    expect(figureAt('2027-01')).toBe(0);
  });

  it('rewrites the whole line when applied from its own first month', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-01', 2200, IncomeChangeScope.FromNowOn);

    expect(figureAt('2026-01')).toBe(2200);
    expect(rowCount()).toBe(1);
  });

  it('crosses the year boundary', () => {
    const line = insertLine(1600, '2025-06', null);

    applyIncomeChange(db, line, '2026-01', 2200, IncomeChangeScope.FromNowOn);

    expect(figureAt('2025-12')).toBe(1600);
    expect(figureAt('2026-01')).toBe(2200);
  });
});

describe('applyIncomeChange — ThisMonth (an exceptional month)', () => {
  it('changes only that month and resumes the old amount after it', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-06', 1900, IncomeChangeScope.ThisMonth);

    expect(figureAt('2026-05')).toBe(1600);
    expect(figureAt('2026-06')).toBe(1900);
    expect(figureAt('2026-07')).toBe(1600);
    expect(figureAt('2027-01')).toBe(1600);
    // Three rows where the user sees one line: the accepted cost of asking.
    expect(rowCount()).toBe(3);
  });

  it('needs only two rows when the month is the line start', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-01', 1900, IncomeChangeScope.ThisMonth);

    expect(figureAt('2026-01')).toBe(1900);
    expect(figureAt('2026-02')).toBe(1600);
    expect(rowCount()).toBe(2);
  });

  it('needs only two rows when the month is the line end', () => {
    const line = insertLine(1600, '2026-01', '2026-06');

    applyIncomeChange(db, line, '2026-06', 1900, IncomeChangeScope.ThisMonth);

    expect(figureAt('2026-05')).toBe(1600);
    expect(figureAt('2026-06')).toBe(1900);
    expect(figureAt('2026-07')).toBe(0);
    expect(rowCount()).toBe(2);
  });

  it('crosses the year boundary on both sides of the slice', () => {
    const line = insertLine(1600, '2025-06', null);

    applyIncomeChange(db, line, '2026-01', 1900, IncomeChangeScope.ThisMonth);

    expect(figureAt('2025-12')).toBe(1600);
    expect(figureAt('2026-01')).toBe(1900);
    expect(figureAt('2026-02')).toBe(1600);
  });

  it('keeps each month served by exactly one row', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-06', 1900, IncomeChangeScope.ThisMonth);

    for (const month of ['2026-01', '2026-05', '2026-06', '2026-07', '2026-12']) {
      expect(listIncomeLinesForMonth(db, USER, month)).toHaveLength(1);
    }
  });
});

describe('applyIncomeChange — single-month lines', () => {
  it.each([IncomeChangeScope.ThisMonth, IncomeChangeScope.FromNowOn])(
    'edits in place whatever the scope says (%s)',
    (scope) => {
      const line = insertLine(300, '2026-06', '2026-06');

      applyIncomeChange(db, line, '2026-06', 450, scope);

      expect(figureAt('2026-05')).toBe(0);
      expect(figureAt('2026-06')).toBe(450);
      expect(figureAt('2026-07')).toBe(0);
      expect(rowCount()).toBe(1);
    },
  );
});

describe('applyIncomeChange — other lines', () => {
  it('never touches a different line in force for the same month', () => {
    const salary = insertLine(1600, '2026-01', null);
    insertLine(400, '2026-01', null);

    applyIncomeChange(db, salary, '2026-06', 2200, IncomeChangeScope.FromNowOn);

    expect(figureAt('2026-05')).toBe(2000);
    expect(figureAt('2026-06')).toBe(2600);
  });

  it('keeps the label on every slice it creates', () => {
    const line = insertLine(1600, '2026-01', null);

    applyIncomeChange(db, line, '2026-06', 1900, IncomeChangeScope.ThisMonth);

    const labels = (
      db.prepare('SELECT DISTINCT label FROM income_lines').all() as { label: string }[]
    ).map((row) => row.label);
    expect(labels).toEqual(['Nómina']);
  });
});
