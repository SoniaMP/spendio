import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import i18next from 'i18next';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import SessionWarning from '@/components/auth/SessionWarning';

// The combobox needs a query client; the language switch is what matters here.
vi.mock('@/components/categories/CategoryCombobox', () => ({
  default: () => <button data-testid="category-combobox" />,
}));

const noop = () => {};

describe('switching language', () => {
  // Wrapped in act(): the language change re-renders components still mounted
  // when this hook runs, before Testing Library's cleanup.
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('es');
    });
  });

  it('renders a form in Spanish and in English', async () => {
    const { unmount } = render(<ExpenseForm onSubmit={noop} isPending={false} />);
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    unmount();

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    render(<ExpenseForm onSubmit={noop} isPending={false} />);
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('keeps interpolated values and markup when translating', async () => {
    await act(async () => {
      await i18next.changeLanguage('en');
    });
    render(<SessionWarning isOpen secondsLeft={90} onExtend={noop} />);

    expect(
      screen.getByText(/Your session will expire in/),
    ).toBeInTheDocument();
    expect(screen.getByText('1m 30s')).toBeInTheDocument();
  });

  it('falls back to the reference catalog for an unknown language', async () => {
    await act(async () => {
      await i18next.changeLanguage('fr');
    });

    render(<ExpenseForm onSubmit={noop} isPending={false} />);
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
  });
});
