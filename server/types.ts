export interface CategoryRow {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: number;
  amount: number;
  description: string;
  date: string;
  category_id: number;
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

export interface CreateExpenseBody {
  amount: number;
  description?: string;
  date: string;
  categoryId: number;
}

export interface UpdateExpenseBody {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: number;
}
