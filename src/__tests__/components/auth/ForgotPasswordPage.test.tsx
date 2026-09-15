import { describe, it, expect, vi } from 'vitest';
import { ErrorCode } from '@shared/errorCodes';
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
    expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar enlace de recuperación' })).toBeInTheDocument();
  });

  it('submits the form with email', async () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar enlace de recuperación' }));

    expect(mockMutate).toHaveBeenCalledWith({ email: 'test@example.com' });
  });

  it('shows success message after submission', () => {
    mockState = { isPending: false, isSuccess: true, error: null };
    renderPage();
    expect(screen.getByText(/enlace de recuperación en breve/i)).toBeInTheDocument();
    expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
  });

  it('translates the API error code', () => {
    mockState = {
      isPending: false,
      isSuccess: false,
      error: new Error(ErrorCode.TooManyRequests),
    };
    renderPage();
    expect(
      screen.getByText('Demasiadas solicitudes. Inténtalo más tarde.'),
    ).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
  });
});
