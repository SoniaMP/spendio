import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/helpers/formatCurrency';
import type { CategoryBreakdown } from '@/types/chartData';

interface TopCategoriesProps {
  categories: CategoryBreakdown[];
}

export default function TopCategories({ categories }: TopCategoriesProps) {
  const top = categories.slice(0, 3);

  if (top.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin categorías</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {top.map((cat) => (
        <Badge key={cat.categoryName} variant="outline" className="gap-1.5">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          {cat.categoryName} {formatCurrency(cat.amount)}
        </Badge>
      ))}
    </div>
  );
}
