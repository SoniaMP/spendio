export interface Expense {
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

export interface ExpenseWithCategory extends Expense {
  category_name: string;
  category_color: string;
}
