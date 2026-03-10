import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn() },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import router from '../../routes/auth.ts';
import bcrypt from 'bcrypt';
import type { Request, Response } from 'express';

function createMockReqRes(body: Record<string, unknown> = {}) {
  const req = {
    body,
    session: {} as Record<string, unknown>,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    clearCookie: vi.fn(),
  } as unknown as Response;

  const next = vi.fn();
  return { req, res, next };
}

type RouteHandler = (req: Request, res: Response, next: unknown) => void;

function getRouteHandler(method: string, path: string) {
  const layer = (router as unknown as { stack: Array<{ route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }> }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  );
  return layer?.route.stack[0].handle;
}

describe('POST /register', () => {
  const handler = getRouteHandler('post', '/register')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when fields are missing', async () => {
    const { req, res, next } = createMockReqRes({ email: 'a@b.com' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when email already exists', async () => {
    const { req, res, next } = createMockReqRes({ email: 'a@b.com', password: '123456', name: 'Test' });
    mockDb.prepare.mockReturnValue({ get: vi.fn().mockReturnValue({ id: 1 }), run: vi.fn() });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates a user and sets session', async () => {
    const user = { id: 1, email: 'a@b.com', name: 'Test', picture: '' };
    const mockGet = vi.fn().mockReturnValueOnce(undefined).mockReturnValueOnce(user);
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    const { req, res, next } = createMockReqRes({ email: 'a@b.com', password: '123456', name: 'Test' });
    await handler(req, res, next);

    expect(req.session.userId).toBe(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
  });
});

describe('POST /login', () => {
  const handler = getRouteHandler('post', '/login')!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when fields are missing', async () => {
    const { req, res, next } = createMockReqRes({});
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when user not found', async () => {
    mockDb.prepare.mockReturnValue({ get: vi.fn().mockReturnValue(undefined) });
    const { req, res, next } = createMockReqRes({ email: 'a@b.com', password: '123456' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when password is wrong', async () => {
    const user = { id: 1, email: 'a@b.com', password_hash: 'hashed', name: 'Test', picture: '' };
    mockDb.prepare.mockReturnValue({ get: vi.fn().mockReturnValue(user) });
    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

    const { req, res, next } = createMockReqRes({ email: 'a@b.com', password: 'wrong' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('logs in successfully with correct credentials', async () => {
    const user = { id: 1, email: 'a@b.com', password_hash: 'hashed', name: 'Test', picture: '' };
    mockDb.prepare.mockReturnValue({ get: vi.fn().mockReturnValue(user) });

    const { req, res, next } = createMockReqRes({ email: 'a@b.com', password: '123456' });
    await handler(req, res, next);

    expect(req.session.userId).toBe(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
  });
});
