import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    prepare: vi.fn(),
    transaction: vi.fn((fn: () => unknown) => fn),
  },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));

const { mockHasSheetAccess } = vi.hoisted(() => ({
  mockHasSheetAccess: vi.fn(),
}));
vi.mock('../../helpers/sheetAccess.ts', () => ({
  hasSheetAccess: mockHasSheetAccess,
}));

import router from '../../routes/summary.ts';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(query: Record<string, string> = {}) {
  const req = { body: {}, params: {}, query, userId: 1 } as unknown as Request;
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

describe('GET /api/summary', () => {
  const handler = getRouteHandler('get', '/')!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHasSheetAccess.mockReturnValue(true);
  });

  it('filters expenses by an inclusive date range', () => {
    const { req, res, next } = createMockReqRes({
      sheetIds: '1',
      from: '2026-06-01',
      to: '2026-06-30',
    });
    const mockAll = vi.fn().mockReturnValue([
      {
        sheet_id: 1,
        sheet_name: 'Casa',
        category_id: 2,
        category_name: 'Comida',
        category_color: '#EF4444',
        total: 120,
        count: 4,
      },
    ]);
    mockDb.prepare.mockReturnValue({ all: mockAll });

    handler(req, res, next);

    expect(mockAll).toHaveBeenCalledWith(1, '2026-06-01', '2026-06-30');
    expect(res.json).toHaveBeenCalledWith({
      sheets: [
        expect.objectContaining({ sheetId: 1, sheetName: 'Casa', total: 120 }),
      ],
    });
  });

  it('returns 400 when from or to is missing', () => {
    const { req, res, next } = createMockReqRes({ sheetIds: '1', from: '2026-06-01' });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when from is after to', () => {
    const { req, res, next } = createMockReqRes({
      sheetIds: '1',
      from: '2026-07-01',
      to: '2026-06-30',
    });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 403 when the user lacks access to a sheet', () => {
    mockHasSheetAccess.mockReturnValue(false);
    const { req, res, next } = createMockReqRes({
      sheetIds: '1',
      from: '2026-06-01',
      to: '2026-06-30',
    });
    handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
