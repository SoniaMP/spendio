import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, materializerMocks } = vi.hoisted(() => ({
  mockDb: {
    prepare: vi.fn(),
    transaction: vi.fn((fn: () => unknown) => fn),
  },
  materializerMocks: {
    todayIso: vi.fn(() => '2026-05-29'),
    materializeHorizon: vi.fn(),
    deleteFutureMaterialized: vi.fn(),
    computeInitialNotifiedIndex: vi.fn(() => -1),
    applyTemplateUpdate: vi.fn(),
  },
}));

vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));

vi.mock('../../services/recurringMaterializer.ts', () => materializerMocks);

import router from '../../routes/recurringExpenses.ts';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
) {
  const req = { body, params, query: {}, userId: 1 } as unknown as Request;
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

const FUTURE_DATE = '2030-01-01';

beforeEach(() => {
  vi.clearAllMocks();
  materializerMocks.todayIso.mockReturnValue('2026-05-29');
  materializerMocks.computeInitialNotifiedIndex.mockReturnValue(-1);
});

describe('POST /', () => {
  const handler = getRouteHandler('post', '/')!;

  it('returns 400 when required fields are missing', () => {
    const { req, res, next } = createMockReqRes({ amount: 100 });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when amount is not > 0', () => {
    const { req, res, next } = createMockReqRes({
      amount: 0,
      categoryId: 1,
      period: 'monthly',
      startDate: FUTURE_DATE,
      sheetId: 1,
    });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when start_date is in the past', () => {
    const { req, res, next } = createMockReqRes({
      amount: 10,
      categoryId: 1,
      period: 'monthly',
      startDate: '2020-01-01',
      sheetId: 1,
    });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when end_date < start_date', () => {
    const { req, res, next } = createMockReqRes({
      amount: 10,
      categoryId: 1,
      period: 'monthly',
      startDate: FUTURE_DATE,
      endDate: '2029-12-31',
      sheetId: 1,
    });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when actor lacks edit on the sheet', () => {
    const { req, res, next } = createMockReqRes({
      amount: 10,
      categoryId: 1,
      period: 'monthly',
      startDate: FUTURE_DATE,
      sheetId: 1,
    });
    const mockGet = vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('creates template + calls materializeHorizon on happy path', () => {
    const { req, res, next } = createMockReqRes({
      amount: 50,
      description: 'Alquiler',
      categoryId: 3,
      period: 'monthly',
      startDate: FUTURE_DATE,
      noticeDays: 5,
      sheetId: 1,
    });
    const created = { id: 10, start_date: FUTURE_DATE, period: 'monthly', user_id: 1 };
    const mockGet = vi
      .fn()
      .mockReturnValueOnce({ id: 1 })
      .mockReturnValueOnce(created)
      .mockReturnValueOnce(created);
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 10 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(mockRun).toHaveBeenCalledWith(
      1, 1, 3, 50, 'Alquiler', 'monthly', FUTURE_DATE, null, 5, -1,
    );
    expect(materializerMocks.materializeHorizon).toHaveBeenCalledWith(created, '2026-05-29');
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('PUT /:id', () => {
  const handler = getRouteHandler('put', '/:id')!;

  it('returns 404 when template does not belong to actor', () => {
    const { req, res, next } = createMockReqRes({ amount: 99 }, { id: '5' });
    const mockGet = vi.fn().mockReturnValueOnce({ id: 5, user_id: 99 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('rejects end_date earlier than start_date', () => {
    const { req, res, next } = createMockReqRes(
      { endDate: '2025-01-01' },
      { id: '5' },
    );
    const existing = { id: 5, user_id: 1, start_date: FUTURE_DATE, end_date: null };
    const mockGet = vi.fn().mockReturnValueOnce(existing);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(materializerMocks.applyTemplateUpdate).not.toHaveBeenCalled();
  });

  it('delegates to applyTemplateUpdate on valid edit', () => {
    const { req, res, next } = createMockReqRes(
      { description: 'Renamed' },
      { id: '5' },
    );
    const existing = { id: 5, user_id: 1, start_date: FUTURE_DATE };
    const mockGet = vi.fn().mockReturnValue(existing);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(materializerMocks.applyTemplateUpdate).toHaveBeenCalledWith(
      existing,
      { description: 'Renamed' },
      '2026-05-29',
    );
  });
});

describe('PATCH /:id/active', () => {
  const handler = getRouteHandler('patch', '/:id/active')!;

  it('returns 400 when isActive is not boolean', () => {
    const { req, res, next } = createMockReqRes({ isActive: 'yes' }, { id: '5' });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('on pause deletes future materialized expenses', () => {
    const { req, res, next } = createMockReqRes({ isActive: false }, { id: '5' });
    const mockGet = vi.fn().mockReturnValue({ id: 5, user_id: 1 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(materializerMocks.deleteFutureMaterialized).toHaveBeenCalledWith(5, '2026-05-29');
    expect(materializerMocks.materializeHorizon).not.toHaveBeenCalled();
  });

  it('on resume materializes horizon', () => {
    const { req, res, next } = createMockReqRes({ isActive: true }, { id: '5' });
    const tpl = { id: 5, user_id: 1 };
    const mockGet = vi.fn().mockReturnValue(tpl);
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });

    handler(req, res, next);

    expect(materializerMocks.materializeHorizon).toHaveBeenCalledWith(tpl, '2026-05-29');
    expect(materializerMocks.deleteFutureMaterialized).not.toHaveBeenCalled();
  });
});

describe('DELETE /:id', () => {
  const handler = getRouteHandler('delete', '/:id')!;

  it('returns 404 when template is not own', () => {
    const { req, res, next } = createMockReqRes({}, { id: '5' });
    const mockGet = vi.fn().mockReturnValueOnce({ id: 5, user_id: 99 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: vi.fn() });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('deletes future materialized then deletes template', () => {
    const { req, res, next } = createMockReqRes({}, { id: '5' });
    const mockGet = vi.fn().mockReturnValue({ id: 5, user_id: 1 });
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(materializerMocks.deleteFutureMaterialized).toHaveBeenCalledWith(5, '2026-05-29');
    expect(mockRun).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
