import { useState, useMemo, useCallback } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortState<K extends string> {
  column: K | null;
  direction: SortDirection;
}

interface UseSortResult<T, K extends string> {
  sortedItems: T[];
  sortColumn: K | null;
  sortDirection: SortDirection;
  toggleSort: (column: K) => void;
}

type SortAccessor<T> = (item: T) => string | number;

export function useSort<T, K extends string>(
  items: T[],
  accessors: Record<K, SortAccessor<T>>,
): UseSortResult<T, K> {
  const [sortState, setSortState] = useState<SortState<K>>({
    column: null,
    direction: 'asc',
  });

  const toggleSort = useCallback((column: K) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: 'asc' };
    });
  }, []);

  const sortedItems = useMemo(() => {
    if (!sortState.column) return items;

    const accessor = accessors[sortState.column];
    const multiplier = sortState.direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);

      if (typeof valA === 'string' && typeof valB === 'string') {
        return multiplier * valA.localeCompare(valB);
      }
      if (valA < valB) return -1 * multiplier;
      if (valA > valB) return 1 * multiplier;
      return 0;
    });
  }, [items, sortState.column, sortState.direction, accessors]);

  return { sortedItems, sortColumn: sortState.column, sortDirection: sortState.direction, toggleSort };
}
