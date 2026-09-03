import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import LanguageSelector from '@/components/settings/LanguageSelector';

describe('LanguageSelector', () => {
  afterEach(async () => {
    await i18next.changeLanguage('es');
  });

  it('lists every available language by its native name', () => {
    render(<LanguageSelector />);

    expect(screen.getByRole('radio', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeInTheDocument();
  });

  it('marks the active language as checked', () => {
    render(<LanguageSelector />);

    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'English' })).not.toBeChecked();
  });

  it('switches the language and translates the copy on click', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    expect(screen.getByText('Idioma de la aplicación')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'English' }));

    expect(i18next.language).toBe('en');
    expect(screen.getByText('Application language')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
  });
});
