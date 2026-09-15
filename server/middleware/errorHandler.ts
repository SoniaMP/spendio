import type { ErrorRequestHandler } from 'express';
import { ErrorCode } from '../../shared/errorCodes.ts';

interface SqliteError extends Error {
  code?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4 params for error handlers
export const errorHandler: ErrorRequestHandler = (err: SqliteError, _req, res, _next) => {
  console.error(err);

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || err.code === 'SQLITE_CONSTRAINT') {
    res.status(409).json({ error: ErrorCode.ConstraintViolation });
    return;
  }

  res.status(500).json({ error: ErrorCode.InternalError });
};
