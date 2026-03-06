import { describe, it, expect, vi } from 'vitest';
import { getSheetRole, hasSheetAccess } from '../../helpers/sheetAccess.ts';

function createMockDb(isOwner: boolean, sharePermission?: 'read' | 'edit') {
  return {
    prepare: vi.fn((sql: string) => {
      if (sql.includes('FROM sheets')) {
        return { get: vi.fn(() => (isOwner ? { id: 1 } : undefined)) };
      }
      return {
        get: vi.fn(() =>
          sharePermission ? { permission: sharePermission } : undefined,
        ),
      };
    }),
  } as unknown as import('better-sqlite3').Database;
}

describe('getSheetRole', () => {
  it('returns "owner" when user owns the sheet', () => {
    const db = createMockDb(true);
    expect(getSheetRole(db, 1, 10)).toBe('owner');
  });

  it('returns share permission when user has a share', () => {
    const db = createMockDb(false, 'edit');
    expect(getSheetRole(db, 1, 10)).toBe('edit');
  });

  it('returns null when user has no access', () => {
    const db = createMockDb(false);
    expect(getSheetRole(db, 1, 10)).toBeNull();
  });
});

describe('hasSheetAccess', () => {
  it('owner satisfies all required levels', () => {
    const db = createMockDb(true);
    expect(hasSheetAccess(db, 1, 10, 'read')).toBe(true);
    expect(hasSheetAccess(db, 1, 10, 'edit')).toBe(true);
    expect(hasSheetAccess(db, 1, 10, 'owner')).toBe(true);
  });

  it('edit satisfies read and edit but not owner', () => {
    const db = createMockDb(false, 'edit');
    expect(hasSheetAccess(db, 1, 10, 'read')).toBe(true);
    expect(hasSheetAccess(db, 1, 10, 'edit')).toBe(true);
    expect(hasSheetAccess(db, 1, 10, 'owner')).toBe(false);
  });

  it('read satisfies only read', () => {
    const db = createMockDb(false, 'read');
    expect(hasSheetAccess(db, 1, 10, 'read')).toBe(true);
    expect(hasSheetAccess(db, 1, 10, 'edit')).toBe(false);
    expect(hasSheetAccess(db, 1, 10, 'owner')).toBe(false);
  });

  it('no access returns false for everything', () => {
    const db = createMockDb(false);
    expect(hasSheetAccess(db, 1, 10, 'read')).toBe(false);
  });
});
