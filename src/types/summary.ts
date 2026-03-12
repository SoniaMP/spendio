export interface CategoryTotal {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
}

export interface SheetSummary {
  sheetId: number;
  sheetName: string;
  total: number;
  categories: CategoryTotal[];
}

export interface SummaryResponse {
  sheets: SheetSummary[];
}
