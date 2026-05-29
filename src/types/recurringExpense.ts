export type RecurringPeriod = 'monthly' | 'yearly';

export interface RecurringExpense {
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
