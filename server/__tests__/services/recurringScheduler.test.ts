import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockDb, mockSendEmail, mockHasSheetAccess, mockMaterializeHorizon, mockTodayIso } =
  vi.hoisted(() => ({
    mockDb: { prepare: vi.fn(), transaction: vi.fn((fn: () => unknown) => fn) },
    mockSendEmail: vi.fn(),
    mockHasSheetAccess: vi.fn(),
    mockMaterializeHorizon: vi.fn(),
    mockTodayIso: vi.fn(),
  }));

vi.mock('../../db.ts', () => ({ default: mockDb, seedCategoriesForUser: vi.fn() }));
vi.mock('../../services/email.ts', () => ({ sendEmail: mockSendEmail }));
vi.mock('../../helpers/sheetAccess.ts', () => ({
  hasSheetAccess: mockHasSheetAccess,
  getSheetRole: vi.fn(),
}));
vi.mock('../../services/recurringMaterializer.ts', async () => {
  const actual = await vi.importActual<
    typeof import('../../services/recurringMaterializer.ts')
  >('../../services/recurringMaterializer.ts');
  return {
    ...actual,
    materializeHorizon: mockMaterializeHorizon,
    todayIso: mockTodayIso,
  };
});

import { runRecurringGeneration } from '../../services/recurringScheduler.ts';

function templateFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    user_id: 10,
    sheet_id: 20,
    category_id: 30,
    amount: 50,
    description: 'Netflix',
    period: 'monthly',
    start_date: '2026-06-15',
    end_date: null,
    notice_days: 3,
    is_active: 1,
    last_generated_period_index: -1,
    last_notified_period_index: -1,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHasSheetAccess.mockReturnValue(true);
  mockTodayIso.mockImplementation((d?: Date) =>
    (d ?? new Date()).toISOString().slice(0, 10),
  );
});

describe('runRecurringGeneration', () => {
  it('skips templates with category_id = null silently', async () => {
    const template = templateFixture({ category_id: null });
    const sqlList: string[] = [];
    mockDb.prepare.mockImplementation((sql: string) => {
      sqlList.push(sql);
      if (sql.includes('FROM recurring_expenses WHERE is_active')) {
        return { get: vi.fn(), all: vi.fn(() => [template]), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(), run: vi.fn() };
    });

    await runRecurringGeneration(new Date('2026-06-15T10:00:00Z'));

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockMaterializeHorizon).not.toHaveBeenCalled();
  });

  it('auto-deactivates and emails when creator lost edit access', async () => {
    mockHasSheetAccess.mockReturnValue(false);
    const template = templateFixture();
    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM recurring_expenses WHERE is_active')) {
        return { get: vi.fn(), all: vi.fn(() => [template]), run: vi.fn() };
      }
      if (sql.includes('FROM users')) {
        return {
          get: vi.fn(() => ({ email: 'a@b.com', name: 'Ana' })),
          all: vi.fn(),
          run: vi.fn(),
        };
      }
      if (sql.includes('FROM sheets')) {
        return { get: vi.fn(() => ({ name: 'Personal' })), all: vi.fn(), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(), run: vi.fn() };
    });

    await runRecurringGeneration(new Date('2026-06-15T10:00:00Z'));

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0]).toMatchObject({
      subject: expect.stringContaining('desactivado'),
    });
    expect(mockMaterializeHorizon).not.toHaveBeenCalled();
  });

  it('extends horizon and sends reminder when within notice window', async () => {
    const template = templateFixture({
      start_date: '2026-06-15',
      notice_days: 3,
      last_generated_period_index: 11,
      last_notified_period_index: -1,
    });
    const sqlList: string[] = [];
    mockDb.prepare.mockImplementation((sql: string) => {
      sqlList.push(sql);
      if (sql.includes('FROM recurring_expenses WHERE is_active')) {
        return { get: vi.fn(), all: vi.fn(() => [template]), run: vi.fn() };
      }
      if (sql.includes('FROM recurring_expenses WHERE id')) {
        return { get: vi.fn(() => template), all: vi.fn(), run: vi.fn() };
      }
      if (sql.includes('FROM users')) {
        return {
          get: vi.fn(() => ({ email: 'a@b.com', name: 'Ana' })),
          all: vi.fn(),
          run: vi.fn(),
        };
      }
      return { get: vi.fn(), all: vi.fn(), run: vi.fn() };
    });

    await runRecurringGeneration(new Date('2026-06-12T10:00:00Z'));

    expect(mockMaterializeHorizon).toHaveBeenCalledWith(template, '2026-06-12');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(sqlList.some((s) => s.includes('last_notified_period_index'))).toBe(true);
  });

  it('does not send reminder when next period is past end_date', async () => {
    const template = templateFixture({
      start_date: '2026-06-15',
      end_date: '2026-06-15',
      notice_days: 3,
      last_generated_period_index: 0,
      last_notified_period_index: 0,
    });
    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM recurring_expenses WHERE is_active')) {
        return { get: vi.fn(), all: vi.fn(() => [template]), run: vi.fn() };
      }
      if (sql.includes('FROM recurring_expenses WHERE id')) {
        return { get: vi.fn(() => template), all: vi.fn(), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(), run: vi.fn() };
    });

    await runRecurringGeneration(new Date('2026-07-12T10:00:00Z'));

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('idempotency: repeat run on same day does not re-notify same period', async () => {
    const template = templateFixture({
      last_generated_period_index: 11,
      last_notified_period_index: 0,
    });
    mockDb.prepare.mockImplementation((sql: string) => {
      if (sql.includes('FROM recurring_expenses WHERE is_active')) {
        return { get: vi.fn(), all: vi.fn(() => [template]), run: vi.fn() };
      }
      if (sql.includes('FROM recurring_expenses WHERE id')) {
        return { get: vi.fn(() => template), all: vi.fn(), run: vi.fn() };
      }
      return { get: vi.fn(), all: vi.fn(), run: vi.fn() };
    });

    await runRecurringGeneration(new Date('2026-07-15T10:00:00Z'));

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
