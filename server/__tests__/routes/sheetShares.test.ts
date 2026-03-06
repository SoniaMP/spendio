import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn() },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));

import router from '../../routes/sheetShares.ts';
import type { Request, Response, NextFunction } from 'express';

function createMockReqRes(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
) {
  const req = {
    body,
    params,
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
  const layer = (router as unknown as { stack: Array<{ route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }> }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  );
  return layer?.route.stack[0].handle;
}

describe('POST / (create share)', () => {
  const handler = getRouteHandler('post', '/')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns needsConfirmation when user not found and no confirm flag', () => {
    const { req, res, next } = createMockReqRes(
      { email: 'unknown@test.com', permission: 'read' },
      { id: '1' },
    );

    const sheet = { id: 1, user_id: 1 };
    const mockGet = vi.fn()
      .mockReturnValueOnce(sheet) // sheet lookup
      .mockReturnValueOnce(undefined); // user lookup - not found
    mockDb.prepare.mockReturnValue({ get: mockGet });

    handler(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      needsConfirmation: true,
      email: 'unknown@test.com',
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('creates placeholder user when confirm=true and user not found', () => {
    const { req, res, next } = createMockReqRes(
      { email: 'unknown@test.com', permission: 'read', confirm: true },
      { id: '1' },
    );

    const sheet = { id: 1, user_id: 1 };
    const placeholderUser = {
      id: 99,
      google_id: '__invited_unknown@test.com__',
      email: 'unknown@test.com',
      name: 'unknown',
      picture: '',
    };

    const mockGet = vi.fn()
      .mockReturnValueOnce(sheet) // sheet lookup
      .mockReturnValueOnce(undefined) // user lookup - not found
      .mockReturnValueOnce(placeholderUser) // after insert, read back
      .mockReturnValueOnce(undefined); // existing share check
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 99 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('shares directly when user exists', () => {
    const { req, res, next } = createMockReqRes(
      { email: 'existing@test.com', permission: 'edit' },
      { id: '1' },
    );

    const sheet = { id: 1, user_id: 1 };
    const targetUser = { id: 2, email: 'existing@test.com' };

    const mockGet = vi.fn()
      .mockReturnValueOnce(sheet)
      .mockReturnValueOnce(targetUser)
      .mockReturnValueOnce(undefined); // no existing share
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('returns 400 when sharing with yourself', () => {
    const { req, res, next } = createMockReqRes(
      { email: 'me@test.com', permission: 'read' },
      { id: '1' },
    );

    const sheet = { id: 1, user_id: 1 };
    const targetUser = { id: 1, email: 'me@test.com' };

    const mockGet = vi.fn()
      .mockReturnValueOnce(sheet)
      .mockReturnValueOnce(targetUser);
    mockDb.prepare.mockReturnValue({ get: mockGet });

    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cannot share with yourself' });
  });
});
