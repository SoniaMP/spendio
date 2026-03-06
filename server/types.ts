export interface UserRow {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: number;
  amount: number;
  description: string;
  date: string;
  category_id: number;
  sheet_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExpenseWithCategoryRow extends ExpenseRow {
  category_name: string;
  category_color: string;
}

export interface CreateCategoryBody {
  name: string;
  color?: string;
}

export interface UpdateCategoryBody {
  name?: string;
  color?: string;
}

export interface SheetRow {
  id: number;
  name: string;
  position: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSheetBody {
  name: string;
}

export interface UpdateSheetBody {
  name?: string;
}

export interface CreateExpenseBody {
  amount: number;
  description?: string;
  date: string;
  categoryId: number;
  sheetId: number;
}

export interface UpdateExpenseBody {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: number;
}

export interface SheetShareRow {
  id: number;
  sheet_id: number;
  shared_by_user_id: number;
  shared_with_user_id: number;
  permission: 'read' | 'edit';
  created_at: string;
  updated_at: string;
}

export interface CreateSheetShareBody {
  email: string;
  permission: 'read' | 'edit';
  confirm?: boolean;
}

export interface UpdateSheetShareBody {
  permission: 'read' | 'edit';
}
