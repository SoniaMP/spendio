import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import ForgotPasswordPage from '@/components/auth/ForgotPasswordPage';

const mockMutate = vi.fn();
let mockState = { isPending: false, isSuccess: false, error: null as Error | null };

vi.mock('@/hooks/useAuth', () => ({
  useForgotPassword: () => ({
    mutate: mockMutate,
    ...mockState,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ForgotPasswordPage', () => {
  it('renders the form with email input', () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
  });

  it('submits the form with email', async () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(mockMutate).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('shows success message after submission', () => {
    mockState = { isPending: false, isSuccess: true, error: null };
    renderPage();
    expect(screen.getByText(/reset link shortly/i)).toBeInTheDocument();
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });

  it('shows error message on failure', () => {
    mockState = { isPending: false, isSuccess: false, error: new Error('Too many requests') };
    renderPage();
    expect(screen.getByText('Too many requests')).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    expect(screen.getByText('Back to login')).toBeInTheDocument();
  });
});
