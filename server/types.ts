export interface UserRow {
  id: number;
  google_id: string | null;
  email: string;
  name: string;
  picture: string;
  password_hash: string | null;
  language: string;
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
  recurring_id: number | null;
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
  sheetId?: number;
}

export interface DuplicateExpenseBody {
  targetSheetId: number;
  date: string;
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

export type RecurringPeriod = 'monthly' | 'yearly';

export interface RecurringExpenseRow {
  id: number;
  user_id: number;
  sheet_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  period: RecurringPeriod;
  start_date: string;
  end_date: string | null;
  notice_days: number;
  is_active: number;
  last_generated_period_index: number;
  last_notified_period_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringExpenseBody {
  amount: number;
  description?: string;
  categoryId: number;
  period: RecurringPeriod;
  startDate: string;
  endDate?: string | null;
  noticeDays?: number;
}

export interface UpdateRecurringExpenseBody {
  amount?: number;
  description?: string;
  categoryId?: number | null;
  period?: RecurringPeriod;
  startDate?: string;
  endDate?: string | null;
  noticeDays?: number;
}

export interface ToggleRecurringExpenseBody {
  isActive: boolean;
}

export interface CreateSheetShareBody {
  email: string;
  permission: 'read' | 'edit';
  confirm?: boolean;
}

export interface UpdateSheetShareBody {
  permission: 'read' | 'edit';
}

/**
 * One source of income for a user, valid from `start_month` until `end_month`
 * (`null` = still in force). Months are `'YYYY-MM'`, which compares correctly as
 * a string and is enforced by a GLOB check in the schema.
 *
 * The line type is derived, never stored: `end_month === null` → in-force
 * recurring; `start_month === end_month` → single month; otherwise → closed
 * recurring (history).
 */
export interface IncomeLineRow {
  id: number;
  user_id: number;
  label: string;
  amount: number;
  start_month: string;
  end_month: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Everything the income chip needs for one month, in a single response: the
 * reference figure, what the actor spent that month across all sheets, and the
 * difference. `spent` never includes other users' expenses, not even on shared
 * sheets.
 */
export interface MonthlyIncomeResponse {
  amount: number;
  spent: number;
  remaining: number;
  lines: IncomeLineRow[];
}

export interface CreateIncomeLineBody {
  label: string;
  amount: number;
  month: string;
  isRecurring: boolean;
}

export interface UpdateIncomeLineBody {
  label?: string;
  amount?: number;
  /** Month on screen. The amount change is applied relative to it. */
  month: string;
  scope?: string;
}
