import { useState } from 'react';
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
  value: number | null;
  onChange: (categoryId: number) => void;
}

export default function CategoryCombobox({
  value,
  onChange,
}: CategoryComboboxProps) {
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
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
              Seleccionar categoría...
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
            placeholder="Buscar categoría..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No se encontraron categorías.</CommandEmpty>
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
                  Crear &quot;{searchValue.trim()}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
