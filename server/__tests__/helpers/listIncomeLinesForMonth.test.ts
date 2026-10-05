import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { CREATE_TABLES } from '../../schema.ts';
import { listIncomeLinesForMonth } from '../../helpers/listIncomeLinesForMonth.ts';

/**
 * Unlike the route tests, this suite runs against a real in-memory database
 * built from the production schema. The rule under test — which lines are "in
 * force" for a month — lives entirely in the SQL WHERE clause and in the
 * lexicographic ordering of `'YYYY-MM'`, so a mocked `prepare` would assert
 * nothing of value.
 */
const USER = 1;
const OTHER_USER = 2;

let db: Database.Database;

function insertLine(
  label: string,
  amount: number,
  startMonth: string,
  endMonth: string | null,
  userId = USER,
) {
  db.prepare(
    `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(userId, label, amount, startMonth, endMonth);
}

function labelsInForce(monthKey: string): string[] {
  return listIncomeLinesForMonth(db, USER, monthKey).map((line) => line.label);
}

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(CREATE_TABLES);
  // better-sqlite3 turns foreign keys on by default, same as server/db.ts, so
  // the referenced users have to exist.
  db.prepare('INSERT INTO users (id, email) VALUES (?, ?), (?, ?)').run(
    USER,
    'owner@spendio.es',
    OTHER_USER,
    'other@spendio.es',
  );
});

describe('listIncomeLinesForMonth', () => {
  it('returns nothing when the user has no lines', () => {
    expect(listIncomeLinesForMonth(db, USER, '2026-10')).toEqual([]);
  });

  it('returns every line whose interval covers the month', () => {
    insertLine('Nómina', 1600, '2026-01', null);
    insertLine('Freelance', 400, '2026-03', null);

    expect(labelsInForce('2026-05')).toEqual(['Nómina', 'Freelance']);
  });

  it('excludes a line that has not started yet', () => {
    insertLine('Freelance', 400, '2026-06', null);

    expect(labelsInForce('2026-05')).toEqual([]);
    expect(labelsInForce('2026-06')).toEqual(['Freelance']);
  });

  it('excludes a closed line once the month is past its end', () => {
    insertLine('Alquiler', 500, '2026-01', '2026-04');

    expect(labelsInForce('2026-04')).toEqual(['Alquiler']);
    expect(labelsInForce('2026-05')).toEqual([]);
  });

  it('includes the months at both ends of the interval', () => {
    insertLine('Nómina', 1600, '2026-03', '2026-07');

    expect(labelsInForce('2026-02')).toEqual([]);
    expect(labelsInForce('2026-03')).toEqual(['Nómina']);
    expect(labelsInForce('2026-07')).toEqual(['Nómina']);
    expect(labelsInForce('2026-08')).toEqual([]);
  });

  it('includes a single-month line only in its own month', () => {
    insertLine('Paga extra', 300, '2026-06', '2026-06');

    expect(labelsInForce('2026-05')).toEqual([]);
    expect(labelsInForce('2026-06')).toEqual(['Paga extra']);
    expect(labelsInForce('2026-07')).toEqual([]);
  });

  it('spans the year boundary', () => {
    insertLine('Nómina', 1600, '2026-11', '2027-02');

    expect(labelsInForce('2026-12')).toEqual(['Nómina']);
    expect(labelsInForce('2027-01')).toEqual(['Nómina']);
    expect(labelsInForce('2027-03')).toEqual([]);
  });

  it('never returns another user\'s lines', () => {
    insertLine('Nómina ajena', 9000, '2026-01', null, OTHER_USER);

    expect(labelsInForce('2026-05')).toEqual([]);
    expect(listIncomeLinesForMonth(db, OTHER_USER, '2026-05')).toHaveLength(1);
  });

  it('returns the three rows a this-month split leaves behind', () => {
    // Shape produced by IncomeChangeScope.ThisMonth: 1.600 € until May, 1.900 €
    // in June only, 1.600 € again from July on.
    insertLine('Nómina', 1600, '2026-01', '2026-05');
    insertLine('Nómina', 1900, '2026-06', '2026-06');
    insertLine('Nómina', 1600, '2026-07', null);

    expect(listIncomeLinesForMonth(db, USER, '2026-05')[0].amount).toBe(1600);
    expect(listIncomeLinesForMonth(db, USER, '2026-06')[0].amount).toBe(1900);
    expect(listIncomeLinesForMonth(db, USER, '2026-07')[0].amount).toBe(1600);
    // Exactly one row per month: intervals of one line never overlap, which is
    // what lets the month-scoped panel show each line once without grouping.
    expect(listIncomeLinesForMonth(db, USER, '2026-06')).toHaveLength(1);
  });
});

describe('income_lines schema guards', () => {
  it('rejects a non-positive amount', () => {
    expect(() => insertLine('Nómina', 0, '2026-01', null)).toThrow();
    expect(() => insertLine('Nómina', -100, '2026-01', null)).toThrow();
  });

  it('rejects a month that is not YYYY-MM', () => {
    expect(() => insertLine('Nómina', 1600, '2026-1', null)).toThrow();
    expect(() => insertLine('Nómina', 1600, 'junio', null)).toThrow();
    expect(() => insertLine('Nómina', 1600, '2026-01-01', null)).toThrow();
  });

  it('rejects an end month before the start month', () => {
    expect(() => insertLine('Nómina', 1600, '2026-06', '2026-05')).toThrow();
  });
});
