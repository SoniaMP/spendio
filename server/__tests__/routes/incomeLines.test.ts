import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '../../../shared/errorCodes.ts';
import { IncomeChangeScope } from '../../../shared/incomeChangeScope.ts';

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

import router from '../../routes/incomeLines.ts';
import type { Request, Response, NextFunction } from 'express';
import type { IncomeLineRow } from '../../types.ts';

const ACTOR = 1;
const OTHER = 2;

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;

function getHandler(method: string, path: string): RouteHandler {
  const layer = (
    router as unknown as {
      stack: Array<{
        route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> };
      }>;
    }
  ).stack.find((l) => l.route?.path === path && l.route.methods[method]);
  return layer!.route.stack[0].handle;
}

function call(
  method: string,
  path: string,
  { body = {}, params = {}, query = {} }: {
    body?: unknown;
    params?: Record<string, string>;
    query?: Record<string, string>;
  },
) {
  const req = { body, params, query, userId: ACTOR } as unknown as Request;
  const json = vi.fn().mockReturnThis();
  const status = vi.fn().mockReturnThis();
  const res = { status, json } as unknown as Response;
  const next = vi.fn() as NextFunction;
  getHandler(method, path)(req, res, next);
  return { status, json, next, body: json.mock.calls[0]?.[0] };
}

function createLine(body: Record<string, unknown>) {
  return call('post', '/', { body });
}

function cancelLine(id: number, month: string) {
  return call('delete', '/:id', { params: { id: String(id) }, query: { month } });
}

function updateLine(id: number, body: Record<string, unknown>) {
  return call('put', '/:id', { params: { id: String(id) }, body });
}

function amountsByMonth(month: string): number[] {
  return (
    testDb
      .prepare(
        `SELECT amount FROM income_lines
         WHERE user_id = ? AND start_month <= ? AND (end_month IS NULL OR end_month >= ?)`,
      )
      .all(ACTOR, month, month) as { amount: number }[]
  ).map((row) => row.amount);
}

function readLine(id: number): IncomeLineRow | undefined {
  return testDb.prepare('SELECT * FROM income_lines WHERE id = ?').get(id) as
    | IncomeLineRow
    | undefined;
}

beforeEach(() => {
  testDb.exec('DELETE FROM income_lines; DELETE FROM users;');
  testDb
    .prepare('INSERT INTO users (id, email) VALUES (?, ?), (?, ?)')
    .run(ACTOR, 'actor@spendio.es', OTHER, 'other@spendio.es');
});

describe('POST /api/income-lines', () => {
  it('creates a recurring line left open', () => {
    const { status, body } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-10',
      isRecurring: true,
    });

    expect(status).toHaveBeenCalledWith(201);
    expect(body.start_month).toBe('2026-10');
    expect(body.end_month).toBeNull();
    expect(body.user_id).toBe(ACTOR);
  });

  it('creates a single-month line that starts and ends in the same month', () => {
    const { body } = createLine({
      label: 'Paga extra',
      amount: 300,
      month: '2026-06',
      isRecurring: false,
    });

    expect(body.start_month).toBe('2026-06');
    expect(body.end_month).toBe('2026-06');
  });

  it('trims the label', () => {
    const { body } = createLine({
      label: '  Freelance  ',
      amount: 400,
      month: '2026-10',
      isRecurring: true,
    });

    expect(body.label).toBe('Freelance');
  });

  it('rejects a missing or blank label', () => {
    for (const label of [undefined, '', '   ']) {
      const { status, body } = createLine({ label, amount: 400, month: '2026-10', isRecurring: true });
      expect(status).toHaveBeenCalledWith(400);
      expect(body).toEqual({ error: ErrorCode.IncomeLabelRequired });
    }
  });

  it('rejects a non-positive amount', () => {
    for (const amount of [0, -100]) {
      const { status, body } = createLine({ label: 'Nómina', amount, month: '2026-10', isRecurring: true });
      expect(status).toHaveBeenCalledWith(400);
      expect(body).toEqual({ error: ErrorCode.AmountMustBePositive });
    }
  });

  it('demands an explicit recurrence flag', () => {
    // Defaulting a missing flag would silently create a single-month line for
    // someone who meant a salary.
    for (const isRecurring of [undefined, 'true', 1, null]) {
      const { status, body } = createLine({
        label: 'Nómina',
        amount: 1600,
        month: '2026-10',
        isRecurring,
      });
      expect(status).toHaveBeenCalledWith(400);
      expect(body).toEqual({ error: ErrorCode.IncomeRecurrenceRequired });
    }
  });

  it('rejects a missing or malformed month', () => {
    expect(createLine({ label: 'Nómina', amount: 100, isRecurring: true }).body).toEqual({
      error: ErrorCode.MissingMonth,
    });
    expect(
      createLine({ label: 'Nómina', amount: 100, month: '2026-13', isRecurring: true }).body,
    ).toEqual({ error: ErrorCode.InvalidMonthFormat });
  });
});

describe('DELETE /api/income-lines/:id — cancel', () => {
  it('closes a recurring line at the previous month, keeping history', () => {
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-01',
      isRecurring: true,
    });

    cancelLine(line.id, '2026-07');

    expect(readLine(line.id)?.end_month).toBe('2026-06');
  });

  it('deletes a single-month line outright — no history to preserve', () => {
    const { body: line } = createLine({
      label: 'Paga extra',
      amount: 300,
      month: '2026-06',
      isRecurring: false,
    });

    cancelLine(line.id, '2026-06');

    expect(readLine(line.id)).toBeUndefined();
  });

  it('deletes instead of closing when cancelling in the line\'s own first month', () => {
    // Closing at M−1 would leave end_month < start_month, which the schema
    // forbids — and the line would never have applied to any month anyway.
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-06',
      isRecurring: true,
    });

    const { status } = cancelLine(line.id, '2026-06');

    expect(status).not.toHaveBeenCalledWith(409);
    expect(readLine(line.id)).toBeUndefined();
  });

  it('deletes when cancelling from a month before the line even starts', () => {
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-06',
      isRecurring: true,
    });

    cancelLine(line.id, '2026-03');

    expect(readLine(line.id)).toBeUndefined();
  });

  it('is a no-op when the line already ends before the requested month', () => {
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-01',
      isRecurring: true,
    });
    cancelLine(line.id, '2026-05');
    expect(readLine(line.id)?.end_month).toBe('2026-04');

    cancelLine(line.id, '2026-10');

    expect(readLine(line.id)?.end_month).toBe('2026-04');
  });

  it('crosses the year boundary', () => {
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2025-06',
      isRecurring: true,
    });

    cancelLine(line.id, '2026-01');

    expect(readLine(line.id)?.end_month).toBe('2025-12');
  });

  it('requires a valid month', () => {
    const { body: line } = createLine({
      label: 'Nómina',
      amount: 1600,
      month: '2026-01',
      isRecurring: true,
    });

    expect(call('delete', '/:id', { params: { id: String(line.id) } }).body).toEqual({
      error: ErrorCode.MissingMonth,
    });
  });

  it('404s on another user\'s line and leaves it untouched', () => {
    testDb
      .prepare(
        `INSERT INTO income_lines (id, user_id, label, amount, start_month, end_month)
         VALUES (99, ?, 'Nómina ajena', 9000, '2026-01', NULL)`,
      )
      .run(OTHER);

    const { status, body } = cancelLine(99, '2026-07');

    expect(status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ error: ErrorCode.IncomeLineNotFound });
    expect(readLine(99)?.end_month).toBeNull();
  });

  it('404s on a line that does not exist', () => {
    const { status } = cancelLine(12345, '2026-07');
    expect(status).toHaveBeenCalledWith(404);
  });
});

describe('PUT /api/income-lines/:id', () => {
  function createRecurring(month = '2026-01') {
    return createLine({
      label: 'Nómina',
      amount: 1600,
      month,
      isRecurring: true,
    }).body;
  }

  it('demands a scope for an amount change on a multi-month line', () => {
    // No safe default exists: "from now on" would overwrite a one-off, and
    // "this month" would quietly fail to apply a raise.
    const line = createRecurring();

    const { status, body } = updateLine(line.id, { amount: 2200, month: '2026-06' });

    expect(status).toHaveBeenCalledWith(400);
    expect(body).toEqual({ error: ErrorCode.InvalidIncomeChangeScope });
  });

  it('rejects an unknown scope', () => {
    const line = createRecurring();

    const { body } = updateLine(line.id, {
      amount: 2200,
      month: '2026-06',
      scope: 'whenever',
    });

    expect(body).toEqual({ error: ErrorCode.InvalidIncomeChangeScope });
  });

  it('applies a raise from the month on screen', () => {
    const line = createRecurring();

    updateLine(line.id, {
      amount: 2200,
      month: '2026-06',
      scope: IncomeChangeScope.FromNowOn,
    });

    expect(amountsByMonth('2026-05')).toEqual([1600]);
    expect(amountsByMonth('2026-06')).toEqual([2200]);
  });

  it('applies an exceptional month without touching its neighbours', () => {
    const line = createRecurring();

    updateLine(line.id, {
      amount: 1900,
      month: '2026-06',
      scope: IncomeChangeScope.ThisMonth,
    });

    expect(amountsByMonth('2026-05')).toEqual([1600]);
    expect(amountsByMonth('2026-06')).toEqual([1900]);
    expect(amountsByMonth('2026-07')).toEqual([1600]);
  });

  it('needs no scope for a single-month line', () => {
    const line = createLine({
      label: 'Paga extra',
      amount: 300,
      month: '2026-06',
      isRecurring: false,
    }).body;

    const { status } = updateLine(line.id, { amount: 450, month: '2026-06' });

    expect(status).not.toHaveBeenCalledWith(400);
    expect(amountsByMonth('2026-06')).toEqual([450]);
  });

  it('renames without asking for a scope, and propagates forward', () => {
    const line = createRecurring();
    updateLine(line.id, {
      amount: 2200,
      month: '2026-06',
      scope: IncomeChangeScope.FromNowOn,
    });

    const { status } = updateLine(line.id, { label: 'Salario', month: '2026-03' });

    expect(status).not.toHaveBeenCalledWith(400);
    const labels = (
      testDb.prepare('SELECT DISTINCT label FROM income_lines').all() as {
        label: string;
      }[]
    ).map((row) => row.label);
    // Both slices renamed: the same income is not called two things.
    expect(labels).toEqual(['Salario']);
  });

  it('carries a simultaneous rename into the slices a raise creates', () => {
    const line = createRecurring();

    updateLine(line.id, {
      label: 'Salario',
      amount: 2200,
      month: '2026-06',
      scope: IncomeChangeScope.FromNowOn,
    });

    const labels = (
      testDb.prepare('SELECT DISTINCT label FROM income_lines').all() as {
        label: string;
      }[]
    ).map((row) => row.label);
    expect(labels).toEqual(['Salario']);
  });

  it('refuses a month the line does not cover', () => {
    const line = createRecurring('2026-06');

    const { status, body } = updateLine(line.id, {
      amount: 2200,
      month: '2026-03',
      scope: IncomeChangeScope.FromNowOn,
    });

    expect(status).toHaveBeenCalledWith(400);
    expect(body).toEqual({ error: ErrorCode.IncomeLineNotInForce });
  });

  it('rejects a blank label and a non-positive amount', () => {
    const line = createRecurring();

    expect(updateLine(line.id, { label: '  ', month: '2026-06' }).body).toEqual({
      error: ErrorCode.IncomeLabelRequired,
    });
    expect(updateLine(line.id, { amount: 0, month: '2026-06' }).body).toEqual({
      error: ErrorCode.AmountMustBePositive,
    });
  });

  it('404s on another user\'s line', () => {
    testDb
      .prepare(
        `INSERT INTO income_lines (id, user_id, label, amount, start_month, end_month)
         VALUES (77, ?, 'Ajena', 9000, '2026-01', NULL)`,
      )
      .run(OTHER);

    const { status } = updateLine(77, {
      amount: 1,
      month: '2026-06',
      scope: IncomeChangeScope.FromNowOn,
    });

    expect(status).toHaveBeenCalledWith(404);
  });
});
