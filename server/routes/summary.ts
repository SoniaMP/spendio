import { Router } from 'express';
import db from '../db.ts';
import { hasSheetAccess } from '../helpers/sheetAccess.ts';

interface SummaryRow {
  sheet_id: number;
  sheet_name: string;
  category_id: number;
  category_name: string;
  category_color: string;
  total: number;
  count: number;
}

interface CategoryTotal {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
}

interface SheetSummary {
  sheetId: number;
  sheetName: string;
  total: number;
  categories: CategoryTotal[];
}

const router = Router();

router.get('/', (req, res) => {
  const sheetIdsParam = req.query.sheetIds as string | undefined;
  const month = req.query.month as string | undefined;

  if (!sheetIdsParam || !month) {
    res.status(400).json({ error: 'sheetIds and month are required' });
    return;
  }

  const sheetIds = sheetIdsParam.split(',').map(Number);

  for (const id of sheetIds) {
    if (!hasSheetAccess(db, id, req.userId, 'read')) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
  }

  const placeholders = sheetIds.map(() => '?').join(',');
  const sql = `
    SELECT e.sheet_id, s.name AS sheet_name,
           c.id AS category_id, c.name AS category_name, c.color AS category_color,
           SUM(e.amount) AS total, COUNT(e.id) AS count
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    JOIN sheets s ON s.id = e.sheet_id
    WHERE e.sheet_id IN (${placeholders}) AND e.date LIKE ? || '%'
    GROUP BY e.sheet_id, c.id
    ORDER BY e.sheet_id, total DESC
  `;

  const rows = db.prepare(sql).all(...sheetIds, month) as SummaryRow[];
  const sheetMap = new Map<number, SheetSummary>();

  for (const row of rows) {
    let sheet = sheetMap.get(row.sheet_id);
    if (!sheet) {
      sheet = {
        sheetId: row.sheet_id,
        sheetName: row.sheet_name,
        total: 0,
        categories: [],
      };
      sheetMap.set(row.sheet_id, sheet);
    }
    sheet.total += row.total;
    sheet.categories.push({
      categoryId: row.category_id,
      categoryName: row.category_name,
      categoryColor: row.category_color,
      total: row.total,
      count: row.count,
    });
  }

  res.json({ sheets: Array.from(sheetMap.values()) });
});

export default router;
