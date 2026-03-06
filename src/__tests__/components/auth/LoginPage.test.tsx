import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from '@/components/auth/LoginPage';

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isError: false,
  }),
  useDevLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  }),
}));

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>
    </GoogleOAuthProvider>,
  );
}

describe('LoginPage', () => {
  it('renders the Spendio title', () => {
    renderLoginPage();
    expect(screen.getByText('Spendio')).toBeInTheDocument();
  });

  it('renders sign-in description', () => {
    renderLoginPage();
    expect(screen.getByText('Controla tus gastos, visualiza tu dinero')).toBeInTheDocument();
  });
});
