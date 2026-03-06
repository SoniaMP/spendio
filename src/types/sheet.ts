export type SheetPermission = 'owner' | 'read' | 'edit';

export interface Sheet {
  id: number;
  name: string;
  position: number;
  permission: SheetPermission;
  shared_by_name: string | null;
  has_shares: number;
  created_at: string;
  updated_at: string;
}

export interface SheetShare {
  id: number;
  sheet_id: number;
  email: string;
  name: string;
  picture: string;
  permission: 'read' | 'edit';
  created_at: string;
}
