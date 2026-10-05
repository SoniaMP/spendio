import { describe, it, expect, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { invalidateExpenseDependents } from '@/lib/invalidateExpenseDependents';
import { QueryKeyRoot } from '@/lib/queryKeys';

describe('invalidateExpenseDependents', () => {
  it('invalidates the expenses cache and everything derived from it', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateExpenseDependents(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKeyRoot.Expenses],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QueryKeyRoot.MonthlyIncome],
    });
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });
});
