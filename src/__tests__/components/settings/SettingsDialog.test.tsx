import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SettingsDialog from '@/components/settings/SettingsDialog';

vi.mock('@/hooks/useCategories', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useCategories')>(
    '@/hooks/useCategories',
  );

  return {
    ...actual,
    useCategories: () => ({ data: [], isLoading: false, isError: false }),
  };
});

function renderSettingsDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsDialog isOpen onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('SettingsDialog', () => {
  it('renders both settings tabs under a single dialog', () => {
    renderSettingsDialog();

    expect(screen.getByRole('dialog', { name: 'Ajustes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Categorías' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Idioma' })).toBeInTheDocument();
  });

  it('opens on the categories tab', () => {
    renderSettingsDialog();

    expect(screen.getByRole('tab', { name: 'Categorías' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('shows the language selector on the language tab', async () => {
    const user = userEvent.setup();
    renderSettingsDialog();

    await user.click(screen.getByRole('tab', { name: 'Idioma' }));

    expect(screen.getByRole('radio', { name: 'Español' })).toBeInTheDocument();
  });
});
