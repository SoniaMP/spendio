import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18next from 'i18next';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginPage from '@/components/auth/LoginPage';

vi.mock('@/hooks/useAuth', () => ({
  useEmailLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useRegister: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
}));

function renderLoginRoute() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuthLayout', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('es');
    });
  });

  it('renders the page inside the shared shell', () => {
    renderLoginRoute();

    expect(screen.getByRole('heading', { name: 'Spendio' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  // The whole point of phase 2.5: before this, language could only be changed
  // once signed in, so the login screen was stuck in the detected language.
  it('lets a visitor change the language before signing in', async () => {
    const user = userEvent.setup();
    renderLoginRoute();

    expect(screen.getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Idioma' }));
    await user.click(await screen.findByRole('menuitem', { name: /English/ }));

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByText('Your data is private and secure')).toBeInTheDocument();
  });
});
