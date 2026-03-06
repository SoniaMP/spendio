import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import SheetShareDialog from '@/components/sheets/SheetShareDialog';

const mockMutate = vi.fn();
vi.mock('@/hooks/useSheetShares', () => ({
  useSheetShares: () => ({ data: [] }),
  useCreateSheetShare: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useUpdateSheetShare: () => ({
    mutate: vi.fn(),
  }),
  useDeleteSheetShare: () => ({
    mutate: vi.fn(),
  }),
}));

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const sheet = { id: 1, name: 'Test Sheet', position: 0, isOwner: true, permission: 'owner' as const };

  return render(
    <QueryClientProvider client={queryClient}>
      <SheetShareDialog sheet={sheet} isOpen onClose={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe('SheetShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the share form', () => {
    renderDialog();
    expect(screen.getByPlaceholderText('Email del usuario')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compartir' })).toBeInTheDocument();
  });

  it('calls mutate with email and permission on submit', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('Email del usuario'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', permission: 'read', confirm: undefined },
      expect.any(Object),
    );
  });

  it('shows confirmation banner when needsConfirmation is returned', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: (data: { needsConfirmation: boolean; email: string }) => void }) => {
      opts.onSuccess({ needsConfirmation: true, email: 'new@example.com' });
    });

    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('Email del usuario'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() => {
      expect(screen.getByText(/no tiene cuenta/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('sends confirm=true when user confirms invitation', async () => {
    let callCount = 0;
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: (data: { needsConfirmation?: boolean; email?: string; success?: boolean }) => void }) => {
      callCount++;
      if (callCount === 1) {
        opts.onSuccess({ needsConfirmation: true, email: 'new@example.com' });
      } else {
        opts.onSuccess({ success: true });
      }
    });

    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('Email del usuario'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mockMutate).toHaveBeenCalledTimes(2);
    expect(mockMutate).toHaveBeenLastCalledWith(
      { email: 'new@example.com', permission: 'read', confirm: true },
      expect.any(Object),
    );
  });

  it('hides confirmation banner when user cancels', async () => {
    mockMutate.mockImplementation((_vars: unknown, opts: { onSuccess: (data: { needsConfirmation: boolean; email: string }) => void }) => {
      opts.onSuccess({ needsConfirmation: true, email: 'new@example.com' });
    });

    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByPlaceholderText('Email del usuario'), 'new@example.com');
    await user.click(screen.getByRole('button', { name: 'Compartir' }));

    await waitFor(() => {
      expect(screen.getByText(/no tiene cuenta/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByText(/no tiene cuenta/)).not.toBeInTheDocument();
  });
});
