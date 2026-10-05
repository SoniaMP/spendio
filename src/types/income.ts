/**
 * One source of income, valid from `start_month` until `end_month`
 * (`null` = still in force). Months are `'YYYY-MM'`.
 *
 * The line type is derived, never stored: `end_month === null` → in-force
 * recurring; `start_month === end_month` → single month; otherwise → closed
 * recurring (history).
 */
export interface IncomeLine {
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
 * Everything the income chip needs for one month. `spent` is what the actor
 * spent that month across **all** sheets, so it does not match the active
 * sheet's `MonthTotal` and the UI has to label the difference.
 */
export interface MonthlyIncome {
  amount: number;
  spent: number;
  remaining: number;
  lines: IncomeLine[];
}
