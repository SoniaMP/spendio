import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';

const ALL_VALUE = 'all';

interface CategoryFilterProps {
  value: number | null;
  onChange: (id: number | null) => void;
}

export default function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();

  function handleChange(selected: string) {
    onChange(selected === ALL_VALUE ? null : Number(selected));
  }

  return (
    <Select
      value={value === null ? ALL_VALUE : String(value)}
      onValueChange={handleChange}
    >
      <SelectTrigger className="w-[140px] sm:w-[200px]">
        <SelectValue placeholder={t('expenses.allCategories')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{t('expenses.allCategories')}</SelectItem>
        {categories?.map((cat) => (
          <SelectItem key={cat.id} value={String(cat.id)}>
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
