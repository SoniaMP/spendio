import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
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

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
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

  it('renders email and password inputs', () => {
    renderLoginPage();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument();
  });

  it('renders register toggle link', () => {
    renderLoginPage();
    expect(screen.getByText('Crear cuenta nueva')).toBeInTheDocument();
  });
});
