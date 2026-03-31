import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRun = vi.fn();
const mockGet = vi.fn();
const mockTransaction = vi.fn((fn: () => void) => fn);

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn(), transaction: vi.fn() },
}));

vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('new_hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('../../services/email.ts', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../templates/passwordReset.ts', () => ({
  passwordResetEmail: vi.fn().mockReturnValue({
    subject: 'Reset',
    html: '<p>reset</p>',
    text: 'reset',
  }),
}));

vi.mock('../../templates/accountActivation.ts', () => ({
  accountActivationEmail: vi.fn().mockReturnValue({
    subject: 'Activate',
    html: '<p>activate</p>',
    text: 'activate',
  }),
}));

import router from '../../routes/auth.ts';
import { sendEmail } from '../../services/email.ts';
import type { Request, Response } from 'express';

function createMockReqRes(body: Record<string, unknown> = {}) {
  const req = {
    body,
    session: {} as Record<string, unknown>,
    headers: { origin: 'http://localhost:5173' },
    protocol: 'http',
    get: vi.fn().mockReturnValue('localhost:5173'),
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

describe('POST /forgot-password', () => {
  const handler = getRouteHandler('post', '/forgot-password')!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });
    mockDb.transaction.mockImplementation(mockTransaction);
  });

  it('returns generic message when no email provided', async () => {
    const { req, res, next } = createMockReqRes({});
    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('returns generic message when user not found', async () => {
    mockGet.mockReturnValue(undefined);
    const { req, res, next } = createMockReqRes({ email: 'nobody@test.com' });
    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String) }),
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends email when user exists', async () => {
    const user = { id: 1, email: 'a@b.com', name: 'Test', password_hash: 'hashed', picture: '' };
    mockGet
      .mockReturnValueOnce(user)
      .mockReturnValueOnce({ count: 0 });
    mockRun.mockReturnValue({});

    const { req, res, next } = createMockReqRes({ email: 'a@b.com' });
    await handler(req, res, next);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@b.com' }),
    );
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded', async () => {
    const user = { id: 1, email: 'a@b.com', name: 'Test', password_hash: 'hashed', picture: '' };
    mockGet
      .mockReturnValueOnce(user)
      .mockReturnValueOnce({ count: 5 });

    const { req, res, next } = createMockReqRes({ email: 'a@b.com' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('uses activation template for stub accounts', async () => {
    const user = { id: 1, email: 'a@b.com', name: 'Stub', password_hash: null, picture: '' };
    mockGet
      .mockReturnValueOnce(user)
      .mockReturnValueOnce({ count: 0 });
    mockRun.mockReturnValue({});

    const { req, res, next } = createMockReqRes({ email: 'a@b.com' });
    await handler(req, res, next);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Activate' }),
    );
  });
});

describe('POST /reset-password', () => {
  const handler = getRouteHandler('post', '/reset-password')!;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnValue({ get: mockGet, run: mockRun });
    mockDb.transaction.mockImplementation(mockTransaction);
  });

  it('returns 400 when token or password missing', async () => {
    const { req, res, next } = createMockReqRes({ token: 'abc' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password too short', async () => {
    const { req, res, next } = createMockReqRes({ token: 'abc', password: '12345' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when token not found', async () => {
    mockGet.mockReturnValue(undefined);
    const { req, res, next } = createMockReqRes({ token: 'abc', password: '123456' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Invalid or expired reset link' }),
    );
  });

  it('returns 400 when token already used', async () => {
    mockGet.mockReturnValue({
      id: 1,
      user_id: 1,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      used_at: new Date().toISOString(),
      uid: 1,
    });
    const { req, res, next } = createMockReqRes({ token: 'abc', password: '123456' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'This reset link has already been used' }),
    );
  });

  it('returns 400 when token expired', async () => {
    mockGet.mockReturnValue({
      id: 1,
      user_id: 1,
      expires_at: new Date(Date.now() - 60000).toISOString(),
      used_at: null,
      uid: 1,
    });
    const { req, res, next } = createMockReqRes({ token: 'abc', password: '123456' });
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'This reset link has expired' }),
    );
  });

  it('resets password successfully', async () => {
    mockGet.mockReturnValue({
      id: 1,
      user_id: 1,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      used_at: null,
      uid: 1,
    });
    mockRun.mockReturnValue({});

    const { req, res, next } = createMockReqRes({ token: 'abc', password: '123456' });
    await handler(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Password has been reset successfully' }),
    );
  });
});
