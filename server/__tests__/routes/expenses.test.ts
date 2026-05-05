import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn() },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));

import router from '../../routes/expenses.ts';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
) {
  const req = {
    body,
    params,
    query: {},
    userId: 1,
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;

function getRouteHandler(method: string, path: string) {
  const layer = (
    router as unknown as {
      stack: Array<{
        route: {
          path: string;
          methods: Record<string, boolean>;
          stack: Array<{ handle: RouteHandler }>;
        };
      }>;
    }
  ).stack.find((l) => l.route?.path === path && l.route.methods[method]);
  return layer?.route.stack[0].handle;
}

describe('PUT /:id (Move)', () => {
  const handler = getRouteHandler('put', '/:id')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('moves expense to new sheet+date when actor owns both', () => {
    const { req, res, next } = createMockReqRes(
      { sheetId: 2, date: '2026-12-15' },
      { id: '5' },
    );
    const existing = {
      id: 5,
      amount: 50,
      description: 'lunch',
      date: '2026-11-15',
      category_id: 1,
      sheet_id: 1,
      user_id: 1,
    };
    const updated = { ...existing, sheet_id: 2, date: '2026-12-15' };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing expense
      .mockReturnValueOnce({ id: 1 }) // source owner check
      .mockReturnValueOnce({ id: 2 }) // destination owner check
      .mockReturnValueOnce(updated); // final select
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(mockRun).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 404 when expense does not exist', () => {
    const { req, res, next } = createMockReqRes({ sheetId: 2 }, { id: '999' });
    const mockGet = vi.fn().mockReturnValueOnce(undefined);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when actor lacks edit permission on source sheet', () => {
    const { req, res, next } = createMockReqRes({ sheetId: 2 }, { id: '5' });
    const existing = { id: 5, sheet_id: 1, user_id: 99 };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing
      .mockReturnValueOnce(undefined) // not owner of source
      .mockReturnValueOnce(undefined); // not shared on source
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when actor lacks edit permission on destination sheet', () => {
    const { req, res, next } = createMockReqRes(
      { sheetId: 2, date: '2026-12-15' },
      { id: '5' },
    );
    const existing = { id: 5, sheet_id: 1, user_id: 1 };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing
      .mockReturnValueOnce({ id: 1 }) // source owner check ok
      .mockReturnValueOnce(undefined) // dest not owner
      .mockReturnValueOnce(undefined); // dest not shared
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('updates without changing sheet_id when sheetId is omitted', () => {
    const { req, res, next } = createMockReqRes(
      { date: '2026-11-20' },
      { id: '5' },
    );
    const existing = {
      id: 5,
      amount: 50,
      description: 'x',
      date: '2026-11-15',
      category_id: 1,
      sheet_id: 1,
      user_id: 1,
    };
    const updated = { ...existing, date: '2026-11-20' };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing
      .mockReturnValueOnce({ id: 1 }) // source owner check ok
      .mockReturnValueOnce(updated); // final select
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(mockRun).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

describe('POST /:id/duplicate', () => {
  const handler = getRouteHandler('post', '/:id/duplicate')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts a new expense with copied fields and actor as user_id', () => {
    const { req, res, next } = createMockReqRes(
      { targetSheetId: 2, date: '2026-12-15' },
      { id: '5' },
    );
    const existing = {
      id: 5,
      amount: 50,
      description: 'lunch',
      date: '2026-11-15',
      category_id: 3,
      sheet_id: 1,
      user_id: 99,
    };
    const inserted = {
      id: 100,
      amount: 50,
      description: 'lunch',
      date: '2026-12-15',
      category_id: 3,
      sheet_id: 2,
      user_id: 1,
    };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing
      .mockReturnValueOnce({ id: 1 }) // source owner check ok
      .mockReturnValueOnce({ id: 2 }) // destination owner check ok
      .mockReturnValueOnce(inserted); // return after INSERT
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 100 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(mockRun).toHaveBeenCalledWith(50, 'lunch', '2026-12-15', 3, 2, 1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(inserted);
  });

  it('returns 400 when targetSheetId is missing', () => {
    const { req, res, next } = createMockReqRes(
      { date: '2026-12-15' },
      { id: '5' },
    );
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when date is missing', () => {
    const { req, res, next } = createMockReqRes(
      { targetSheetId: 2 },
      { id: '5' },
    );
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when source expense does not exist', () => {
    const { req, res, next } = createMockReqRes(
      { targetSheetId: 2, date: '2026-12-15' },
      { id: '999' },
    );
    const mockGet = vi.fn().mockReturnValueOnce(undefined);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 403 when actor lacks edit permission on destination', () => {
    const { req, res, next } = createMockReqRes(
      { targetSheetId: 2, date: '2026-12-15' },
      { id: '5' },
    );
    const existing = { id: 5, sheet_id: 1, user_id: 1 };

    const mockGet = vi
      .fn()
      .mockReturnValueOnce(existing) // existing
      .mockReturnValueOnce({ id: 1 }) // source owner check ok
      .mockReturnValueOnce(undefined) // dest not owner
      .mockReturnValueOnce(undefined); // dest not shared
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
