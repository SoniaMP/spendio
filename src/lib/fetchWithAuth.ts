import { queryClient } from '@/lib/queryClient';

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: 'include' });

  if (res.status === 401) {
    queryClient.setQueryData(['auth'], null);
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  }

  return res;
}
