import './types/session.ts';
import express from 'express';
import cors from 'cors';
import { sessionMiddleware } from './session.ts';
import authRouter from './routes/auth.ts';
import { requireAuth } from './middleware/requireAuth.ts';
import categoriesRouter from './routes/categories.ts';
import expensesRouter from './routes/expenses.ts';
import sheetsRouter from './routes/sheets.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);

app.use('/api/auth', authRouter);

app.use(requireAuth);

app.use('/api/categories', categoriesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/sheets', sheetsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
