import './types/session.ts';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { sessionMiddleware } from './session.ts';
import authRouter from './routes/auth.ts';
import { requireAuth } from './middleware/requireAuth.ts';
import categoriesRouter from './routes/categories.ts';
import expensesRouter from './routes/expenses.ts';
import sheetsRouter from './routes/sheets.ts';
import sheetSharesRouter from './routes/sheetShares.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();
const PORT = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(express.json());
app.use(sessionMiddleware);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(import.meta.dirname, '..', 'dist');
  app.use(express.static(distPath));
}

app.use('/api/auth', authRouter);
app.use('/api', requireAuth);
app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/sheets', sheetsRouter);
app.use('/api/sheets/:id/shares', sheetSharesRouter);

app.use(errorHandler);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(import.meta.dirname, '..', 'dist');
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
