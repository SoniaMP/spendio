import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/requireAuth.ts';

function createMockReqRes(sessionUserId?: number) {
  const req = {
    session: { userId: sessionUserId },
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('requireAuth', () => {
  it('returns 401 when session has no userId', () => {
    const { req, res, next } = createMockReqRes(undefined);
    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.userId and calls next when session has userId', () => {
    const { req, res, next } = createMockReqRes(42);
    requireAuth(req, res, next);

    expect(req.userId).toBe(42);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
