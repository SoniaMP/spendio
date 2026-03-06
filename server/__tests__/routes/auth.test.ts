import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn() },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));
vi.mock('google-auth-library', () => ({
  OAuth2Client: class {},
}));

import router from '../../routes/auth.ts';
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

  return { req, res };
}

type RouteHandler = (req: Request, res: Response, next?: unknown) => void;

function getRouteHandler(method: string, path: string) {
  const layer = (router as unknown as { stack: Array<{ route: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RouteHandler }> } }> }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  );
  return layer?.route.stack[0].handle;
}

describe('POST /dev-login', () => {
  const handler = getRouteHandler('post', '/dev-login')!;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VITE_AUTH_BYPASS = 'true';
  });

  it('creates dev1 user by default', () => {
    const { req, res } = createMockReqRes({});
    const dev1User = { id: 1, google_id: '__dev_user_1__', email: 'dev1@spendio.local', name: 'Dev 1', picture: '' };
    const mockGet = vi.fn()
      .mockReturnValueOnce(undefined) // old __dev_user__ migration check
      .mockReturnValueOnce(undefined) // lookup by google_id
      .mockReturnValueOnce(undefined) // lookup by email (existingByEmail)
      .mockReturnValueOnce(dev1User); // read back after insert
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dev1@spendio.local', name: 'Dev 1' }),
    );
  });

  it('creates dev2 user when devUser=dev2', () => {
    const { req, res } = createMockReqRes({ devUser: 'dev2' });
    const dev2User = { id: 2, google_id: '__dev_user_2__', email: 'dev2@spendio.local', name: 'Dev 2', picture: '' };
    const mockGet = vi.fn()
      .mockReturnValueOnce(undefined) // old __dev_user__ migration check
      .mockReturnValueOnce(undefined) // lookup by google_id
      .mockReturnValueOnce(undefined) // lookup by email
      .mockReturnValueOnce(dev2User); // read back after insert
    const mockRun = vi.fn().mockReturnValue({ lastInsertRowid: 2 });
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dev2@spendio.local', name: 'Dev 2' }),
    );
  });

  it('upgrades placeholder user when email already exists', () => {
    const { req, res } = createMockReqRes({ devUser: 'dev2' });
    const placeholder = { id: 5, google_id: '__invited_dev2@spendio.local__', email: 'dev2@spendio.local', name: 'dev2', picture: '' };
    const upgraded = { id: 5, google_id: '__dev_user_2__', email: 'dev2@spendio.local', name: 'Dev 2', picture: '' };
    const mockGet = vi.fn()
      .mockReturnValueOnce(undefined) // old __dev_user__ migration check
      .mockReturnValueOnce(undefined) // lookup by google_id
      .mockReturnValueOnce(placeholder) // lookup by email - found placeholder
      .mockReturnValueOnce(upgraded); // read back after update
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res);

    expect(mockRun).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dev2@spendio.local', name: 'Dev 2' }),
    );
  });

  it('migrates old __dev_user__ to __dev_user_1__', () => {
    const { req, res } = createMockReqRes({});
    const oldUser = { id: 99, google_id: '__dev_user__', email: 'dev@spendio.local', name: 'Dev User', picture: '' };
    const migratedUser = { id: 99, google_id: '__dev_user_1__', email: 'dev1@spendio.local', name: 'Dev 1', picture: '' };
    const mockGet = vi.fn()
      .mockReturnValueOnce(oldUser) // old __dev_user__ found
      .mockReturnValueOnce(migratedUser); // after migration, found __dev_user_1__
    const mockRun = vi.fn();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });

    handler(req, res);

    expect(mockRun).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dev1@spendio.local' }),
    );
  });

  it('returns 404 when VITE_AUTH_BYPASS is not true', () => {
    process.env.VITE_AUTH_BYPASS = 'false';
    const { req, res } = createMockReqRes({});

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
