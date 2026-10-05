import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '../../../shared/errorCodes.ts';

/**
 * The route is exercised against a real in-memory database instead of a mocked
 * `prepare`, because the rule worth testing here lives in SQL: `spent` must
 * count the actor's expenses on every sheet and nobody else's.
 */
const { testDb } = await vi.hoisted(async () => {
  const { default: Database } = await import('better-sqlite3');
  const { CREATE_TABLES } = await import('../../schema.ts');
  const db = new Database(':memory:');
  db.exec(CREATE_TABLES);
  return { testDb: db };
});

vi.mock('../../db.ts', () => ({
  default: testDb,
  seedCategoriesForUser: vi.fn(),
}));

import router from '../../routes/monthlyIncome.ts';
import type { Request, Response, NextFunction } from 'express';

const ACTOR = 1;
const OTHER = 2;
const OWN_SHEET = 1;
const SHARED_SHEET = 2;

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;

function getHandler(): RouteHandler {
  const layer = (
    router as unknown as {
      stack: Array<{
        route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> };
      }>;
    }
  ).stack.find((l) => l.route?.path === '/' && l.route.methods.get);
  return layer!.route.stack[0].handle;
}

function callRoute(query: Record<string, string>) {
  const req = { body: {}, params: {}, query, userId: ACTOR } as unknown as Request;
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnThis();
  const res = { status, json } as unknown as Response;
  getHandler()(req, res, vi.fn() as NextFunction);
  return { status, json, body: json.mock.calls[0]?.[0] };
}

function insertLine(amount: number, startMonth: string, endMonth: string | null) {
  testDb
    .prepare(
      `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
       VALUES (?, 'Nómina', ?, ?, ?)`,
    )
    .run(ACTOR, amount, startMonth, endMonth);
}

function insertExpense(amount: number, date: string, sheetId: number, userId: number) {
  testDb
    .prepare(
      `INSERT INTO expenses (amount, date, category_id, sheet_id, user_id)
       VALUES (?, ?, 1, ?, ?)`,
    )
    .run(amount, date, sheetId, userId);
}

beforeEach(() => {
  testDb.exec('DELETE FROM income_lines; DELETE FROM expenses; DELETE FROM sheet_shares;');
  testDb.exec('DELETE FROM categories; DELETE FROM sheets; DELETE FROM users;');
  testDb
    .prepare('INSERT INTO users (id, email) VALUES (?, ?), (?, ?)')
    .run(ACTOR, 'actor@spendio.es', OTHER, 'other@spendio.es');
  testDb
    .prepare('INSERT INTO sheets (id, name, user_id) VALUES (?, ?, ?), (?, ?, ?)')
    .run(OWN_SHEET, 'Personal', ACTOR, SHARED_SHEET, 'Casa', OTHER);
  testDb
    .prepare('INSERT INTO sheet_shares (sheet_id, shared_by_user_id, shared_with_user_id, permission) VALUES (?, ?, ?, ?)')
    .run(SHARED_SHEET, OTHER, ACTOR, 'edit');
  testDb.prepare('INSERT INTO categories (id, name, user_id) VALUES (1, ?, ?)').run('Ocio', ACTOR);
});

describe('GET /api/monthly-income — validation', () => {
  it('requires a month', () => {
    const { status, body } = callRoute({});
    expect(status).toHaveBeenCalledWith(400);
    expect(body).toEqual({ error: ErrorCode.MissingMonth });
  });

  it('rejects a malformed month', () => {
    const { status, body } = callRoute({ month: '2026-1' });
    expect(status).toHaveBeenCalledWith(400);
    expect(body).toEqual({ error: ErrorCode.InvalidMonthFormat });
  });
});

describe('GET /api/monthly-income — figures', () => {
  it('is all zeros when the user has nothing', () => {
    const { body } = callRoute({ month: '2026-10' });
    expect(body).toEqual({ amount: 0, spent: 0, remaining: 0, lines: [] });
  });

  it('sums the lines in force and returns them', () => {
    insertLine(1600, '2026-01', null);
    insertLine(300, '2026-10', '2026-10');

    const { body } = callRoute({ month: '2026-10' });
    expect(body.amount).toBe(1900);
    expect(body.lines).toHaveLength(2);
  });

  it('ignores lines that are not in force for the month', () => {
    insertLine(1600, '2026-01', '2026-09');

    expect(callRoute({ month: '2026-10' }).body.amount).toBe(0);
    expect(callRoute({ month: '2026-09' }).body.amount).toBe(1600);
  });

  it('counts the actor\'s expenses on their own sheet', () => {
    insertExpense(120, '2026-10-05', OWN_SHEET, ACTOR);

    expect(callRoute({ month: '2026-10' }).body.spent).toBe(120);
  });

  it('counts the actor\'s expenses logged on a sheet shared with them', () => {
    insertExpense(80, '2026-10-07', SHARED_SHEET, ACTOR);

    expect(callRoute({ month: '2026-10' }).body.spent).toBe(80);
  });

  it('never counts another user\'s expenses, even on a sheet the actor can see', () => {
    insertExpense(500, '2026-10-07', SHARED_SHEET, OTHER);
    insertExpense(500, '2026-10-08', OWN_SHEET, OTHER);

    expect(callRoute({ month: '2026-10' }).body.spent).toBe(0);
  });

  it('counts only the requested month', () => {
    insertExpense(100, '2026-09-30', OWN_SHEET, ACTOR);
    insertExpense(200, '2026-10-01', OWN_SHEET, ACTOR);
    insertExpense(300, '2026-11-01', OWN_SHEET, ACTOR);

    expect(callRoute({ month: '2026-10' }).body.spent).toBe(200);
  });

  it('reports a negative remaining when spending passes the figure', () => {
    insertLine(1000, '2026-10', null);
    insertExpense(1200, '2026-10-05', OWN_SHEET, ACTOR);

    const { body } = callRoute({ month: '2026-10' });
    expect(body.remaining).toBe(-200);
  });

  it('still counts a cancelled line in the months it was in force', () => {
    // The user-facing half of UC-INC-05: cancelling must not falsify history.
    // Written against the read endpoint, not just the stored end_month.
    insertLine(1600, '2026-01', null);
    const id = testDb.prepare('SELECT id FROM income_lines').get() as { id: number };
    testDb.prepare('UPDATE income_lines SET end_month = ? WHERE id = ?').run('2026-06', id.id);

    expect(callRoute({ month: '2026-05' }).body.amount).toBe(1600);
    expect(callRoute({ month: '2026-06' }).body.amount).toBe(1600);
    expect(callRoute({ month: '2026-07' }).body.amount).toBe(0);
  });

  it('returns exactly zero instead of a float artifact', () => {
    insertLine(1000.1, '2026-10', null);
    insertExpense(0.1, '2026-10-05', OWN_SHEET, ACTOR);
    insertExpense(1000, '2026-10-06', OWN_SHEET, ACTOR);

    const { body } = callRoute({ month: '2026-10' });
    expect(body.remaining).toBe(0);
    expect(Object.is(body.remaining, -0)).toBe(false);
  });
});
