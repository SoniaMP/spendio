import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The monthly-income feature is only safe because income never enters an
 * expense aggregate: no total switches from gross to net, no chart, no export.
 * That boundary is written down in `docs/business/00.project-overview.md` and in
 * `docs/business/features/05.income.md`, and this suite is what keeps it from
 * eroding — a future "just show the net total in the summary" has to break a
 * test instead of quietly shipping.
 *
 * The Excel export needs no case of its own: `src/helpers/exportToExcel.ts`
 * builds each row from an explicit four-key allowlist, so it cannot pick up a
 * new field even if one appeared in the payload. Its input is the `GET
 * /api/expenses` response, which is covered here.
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

import expensesRouter from '../../routes/expenses.ts';
import summaryRouter from '../../routes/summary.ts';
import type { Request, Response, NextFunction } from 'express';
import type { Router } from 'express';

const ACTOR = 1;
const SHEET = 1;

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;

function readRoute(router: Router, query: Record<string, string>) {
  const layer = (
    router as unknown as {
      stack: Array<{
        route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> };
      }>;
    }
  ).stack.find((l) => l.route?.path === '/' && l.route.methods.get);

  const req = { body: {}, params: {}, query, userId: ACTOR } as unknown as Request;
  const json = vi.fn().mockReturnThis();
  const res = { status: vi.fn().mockReturnThis(), json } as unknown as Response;
  layer!.route.stack[0].handle(req, res, vi.fn() as NextFunction);
  return json.mock.calls[0]?.[0];
}

function insertIncomeLines() {
  const insert = testDb.prepare(
    `INSERT INTO income_lines (user_id, label, amount, start_month, end_month)
     VALUES (?, ?, ?, ?, ?)`,
  );
  insert.run(ACTOR, 'Nómina', 1600, '2026-01', null);
  insert.run(ACTOR, 'Paga extra', 300, '2026-10', '2026-10');
  insert.run(ACTOR, 'Freelance', 400, '2026-03', '2026-09');
}

beforeEach(() => {
  testDb.exec(
    'DELETE FROM income_lines; DELETE FROM expenses; DELETE FROM categories; DELETE FROM sheets; DELETE FROM users;',
  );
  testDb.prepare('INSERT INTO users (id, email) VALUES (?, ?)').run(ACTOR, 'actor@spendio.es');
  testDb.prepare('INSERT INTO sheets (id, name, user_id) VALUES (?, ?, ?)').run(SHEET, 'Personal', ACTOR);
  testDb
    .prepare('INSERT INTO categories (id, name, color, user_id) VALUES (1, ?, ?, ?), (2, ?, ?, ?)')
    .run('Alimentación', '#EF4444', ACTOR, 'Ocio', '#3B82F6', ACTOR);

  const insert = testDb.prepare(
    `INSERT INTO expenses (amount, description, date, category_id, sheet_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  insert.run(120.5, 'Compra', '2026-10-03', 1, SHEET, ACTOR);
  insert.run(45, 'Cine', '2026-10-11', 2, SHEET, ACTOR);
  insert.run(300, 'Compra grande', '2026-10-28', 1, SHEET, ACTOR);
});

describe('income never leaks into expense aggregates', () => {
  it('GET /api/expenses is identical with and without income lines', () => {
    const query = { month: '2026-10', sheetId: String(SHEET) };

    const before = readRoute(expensesRouter, query);
    insertIncomeLines();
    const after = readRoute(expensesRouter, query);

    expect(after).toEqual(before);
    expect(after).toHaveLength(3);
    // Nothing income-shaped in the payload the table, charts and export consume.
    for (const row of after) {
      expect(Object.keys(row).some((k) => k.includes('income'))).toBe(false);
      expect(Object.keys(row).some((k) => k.includes('remaining'))).toBe(false);
      expect(Object.keys(row).some((k) => k.includes('net'))).toBe(false);
    }
  });

  it('GET /api/summary is identical with and without income lines', () => {
    const query = { sheetIds: String(SHEET), from: '2026-10-01', to: '2026-10-31' };

    const before = readRoute(summaryRouter, query);
    insertIncomeLines();
    const after = readRoute(summaryRouter, query);

    expect(after).toEqual(before);
    // The sheet total stays gross: 120.50 + 45 + 300, untouched by a 1.900 €
    // reference figure in force for the very same month.
    expect(after.sheets[0].total).toBeCloseTo(465.5, 2);
  });

  it('the expenses payload keys are exactly the ones the export allows', () => {
    insertIncomeLines();
    const [row] = readRoute(expensesRouter, { month: '2026-10', sheetId: String(SHEET) });

    // exportToExcel reads date, description, category_name and amount. If this
    // set ever grows, the export and the charts need a deliberate review.
    expect(Object.keys(row).sort()).toEqual(
      [
        'amount',
        'category_color',
        'category_id',
        'category_name',
        'created_at',
        'date',
        'description',
        'id',
        'recurring_id',
        'sheet_id',
        'updated_at',
        'user_id',
      ].sort(),
    );
  });
});
