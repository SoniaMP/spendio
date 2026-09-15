import { describe, it, expect, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import LanguageDropdown from '@/components/i18n/LanguageDropdown';

describe('LanguageDropdown', () => {
  afterEach(async () => {
    await act(async () => {
      await i18next.changeLanguage('es');
    });
  });

  it('shows the active language code on the trigger', () => {
    render(<LanguageDropdown />);

    expect(screen.getByRole('button', { name: 'Idioma' })).toHaveTextContent('ES');
  });

  it('lists every available language by its native name', async () => {
    const user = userEvent.setup();
    render(<LanguageDropdown />);

    await user.click(screen.getByRole('button', { name: 'Idioma' }));

    expect(await screen.findByRole('menuitem', { name: /Español/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /English/ })).toBeInTheDocument();
  });

  it('marks the active language', async () => {
    const user = userEvent.setup();
    render(<LanguageDropdown />);

    await user.click(screen.getByRole('button', { name: 'Idioma' }));

    expect(await screen.findByRole('menuitem', { name: /Español/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(screen.getByRole('menuitem', { name: /English/ })).toHaveAttribute(
      'aria-current',
      'false',
    );
  });

  it('changes the language when picking another one', async () => {
    const user = userEvent.setup();
    render(<LanguageDropdown />);

    await user.click(screen.getByRole('button', { name: 'Idioma' }));
    await user.click(await screen.findByRole('menuitem', { name: /English/ }));

    expect(i18next.language).toBe('en');
    expect(screen.getByRole('button', { name: 'Language' })).toHaveTextContent('EN');
  });
});
