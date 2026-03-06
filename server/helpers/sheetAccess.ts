import type Database from 'better-sqlite3';

export type SheetRole = 'owner' | 'edit' | 'read';

export function getSheetRole(
  db: Database.Database,
  sheetId: number,
  userId: number,
): SheetRole | null {
  const ownerRow = db
    .prepare('SELECT id FROM sheets WHERE id = ? AND user_id = ?')
    .get(sheetId, userId);
  if (ownerRow) return 'owner';

  const shareRow = db
    .prepare(
      'SELECT permission FROM sheet_shares WHERE sheet_id = ? AND shared_with_user_id = ?',
    )
    .get(sheetId, userId) as { permission: 'read' | 'edit' } | undefined;

  return shareRow?.permission ?? null;
}

const ROLE_LEVEL: Record<SheetRole, number> = { read: 1, edit: 2, owner: 3 };

export function hasSheetAccess(
  db: Database.Database,
  sheetId: number,
  userId: number,
  required: SheetRole,
): boolean {
  const role = getSheetRole(db, sheetId, userId);
  if (!role) return false;
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required];
}
