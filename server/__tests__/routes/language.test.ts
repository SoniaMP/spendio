import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '../../../shared/errorCodes.ts';

const { mockDb } = vi.hoisted(() => ({
  mockDb: { prepare: vi.fn() },
}));
vi.mock('../../db.ts', () => ({
  default: mockDb,
  seedCategoriesForUser: vi.fn(),
}));
vi.mock('bcrypt', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));
vi.mock('../../services/email.ts', () => ({ sendEmail: vi.fn() }));
vi.mock('../../templates/passwordReset.ts', () => ({
  passwordResetEmail: vi.fn().mockReturnValue({ subject: '', html: '', text: '' }),
}));
vi.mock('../../templates/accountActivation.ts', () => ({
  accountActivationEmail: vi.fn().mockReturnValue({ subject: '', html: '', text: '' }),
}));

import router from '../../routes/auth.ts';
import type { Request, Response } from 'express';

type RouteHandler = (req: Request, res: Response, next: unknown) => void;

function createMockReqRes(
  body: Record<string, unknown> = {},
  session: Record<string, unknown> = {},
) {
  const req = { body, session } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return { req, res, next: vi.fn() };
}

const handler = (
  router as unknown as {
    stack: Array<{
      route: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: RouteHandler }>;
      };
    }>;
  }
).stack.find((l) => l.route?.path === '/language' && l.route.methods.patch)!
  .route.stack[0].handle;

describe('PATCH /language', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an anonymous request', () => {
    const { req, res, next } = createMockReqRes({ language: 'en' });
    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: ErrorCode.NotAuthenticated });
  });

  it('rejects an unsupported language', () => {
    const { req, res, next } = createMockReqRes({ language: 'kl' }, { userId: 1 });
    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: ErrorCode.UnsupportedLanguage });
  });

  it('rejects a missing language', () => {
    const { req, res, next } = createMockReqRes({}, { userId: 1 });
    handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('stores a supported language for the session user', () => {
    const run = vi.fn();
    mockDb.prepare.mockReturnValue({ run });
    const { req, res, next } = createMockReqRes({ language: 'en' }, { userId: 7 });

    handler(req, res, next);

    expect(run).toHaveBeenCalledWith('en', 7);
    expect(res.json).toHaveBeenCalledWith({ language: 'en' });
  });
});
