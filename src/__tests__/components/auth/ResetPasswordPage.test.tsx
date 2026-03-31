import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import ResetPasswordPage from '@/components/auth/ResetPasswordPage';

const mockMutate = vi.fn();
let mockState = { isPending: false, isSuccess: false, error: null as Error | null };

vi.mock('@/hooks/useAuth', () => ({
  useResetPassword: () => ({
    mutate: mockMutate,
    ...mockState,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/reset-password/test-token-123']}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ResetPasswordPage', () => {
  it('renders the form with password fields', () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    expect(screen.getByRole('heading', { name: 'Nueva contraseña' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restablecer contraseña' })).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nueva contraseña'), 'password1');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'password2');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits form with matching passwords', async () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Nueva contraseña'), 'newpassword');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'newpassword');
    await user.click(screen.getByRole('button', { name: 'Restablecer contraseña' }));

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'test-token-123', password: 'newpassword' }),
      expect.any(Object),
    );
  });

  it('shows success message after reset', () => {
    mockState = { isPending: false, isSuccess: true, error: null };
    renderPage();
    expect(screen.getByText(/restableció correctamente/i)).toBeInTheDocument();
    expect(screen.getByText('Ir al inicio de sesión')).toBeInTheDocument();
  });

  it('shows API error message', () => {
    mockState = { isPending: false, isSuccess: false, error: new Error('Enlace de restablecimiento inválido o expirado') };
    renderPage();
    expect(screen.getByText('Enlace de restablecimiento inválido o expirado')).toBeInTheDocument();
  });

  it('has a link back to login', () => {
    mockState = { isPending: false, isSuccess: false, error: null };
    renderPage();
    expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
  });
});
