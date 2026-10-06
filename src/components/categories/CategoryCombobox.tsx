import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';

interface CategoryComboboxProps {
  /**
   * Id of the trigger button, so the form's `<Label htmlFor>` names it. Required
   * rather than optional: without it a screen reader announces the control as
   * just "combobox", with no clue what it picks.
   */
  id: string;
  value: number | null;
  onChange: (categoryId: number) => void;
}

export default function CategoryCombobox({
  id,
  value,
  onChange,
}: CategoryComboboxProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { data: categories } = useCategories();
  const createMutation = useCreateCategory();

  const selectedCategory = categories?.find((c) => c.id === value);

  const filteredCategories =
    categories?.filter((c) =>
      c.name.toLowerCase().includes(searchValue.toLowerCase().trim()),
    ) ?? [];

  const hasExactMatch = categories?.some(
    (c) => c.name.toLowerCase() === searchValue.toLowerCase().trim(),
  );
  const showCreateOption = searchValue.trim() && !hasExactMatch;

  function handleSelect(categoryId: number) {
    onChange(categoryId);
    setIsOpen(false);
    setSearchValue('');
  }

  function handleCreate() {
    const name = searchValue.trim();
    if (!name) return;
    createMutation.mutate(
      { name },
      {
        onSuccess: (created) => {
          onChange(created.id);
          setIsOpen(false);
          setSearchValue('');
        },
      },
    );
  }

  return (
    /* `modal` is what makes the category list scrollable. This combobox is
       always rendered inside a Dialog, and Radix's dialog overlay wraps the page
       in `RemoveScroll` with only the dialog content as an allowed region. The
       popover is portaled to `document.body`, i.e. outside that region, so wheel
       and touch events over the list were being swallowed. A modal popover
       mounts its own `RemoveScroll`, declaring itself a scrollable region. */
    <Popover open={isOpen} onOpenChange={setIsOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between font-normal"
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
              {selectedCategory.name}
            </div>
          ) : (
            <span className="text-muted-foreground">
              {t('categories.combobox.placeholder')}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('categories.combobox.search')}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{t('categories.combobox.notFound')}</CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={String(cat.id)}
                  onSelect={() => handleSelect(cat.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === cat.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem onSelect={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('categories.combobox.create', { name: searchValue.trim() })}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
