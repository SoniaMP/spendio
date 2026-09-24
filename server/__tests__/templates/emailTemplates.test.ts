import { describe, it, expect } from 'vitest';
import { Language, SUPPORTED_LANGUAGES } from '../../../shared/languages.ts';
import { accountActivationEmail } from '../../templates/accountActivation.ts';
import { passwordResetEmail } from '../../templates/passwordReset.ts';
import { recurringExpenseAlertEmail } from '../../templates/recurringExpenseAlert.ts';
import { recurringExpenseDeactivatedEmail } from '../../templates/recurringExpenseDeactivated.ts';

const RESET_URL = 'https://spendio.soniadev.es/reset-password/abc';

function buildAll(language: Language) {
  return [
    accountActivationEmail({ resetUrl: RESET_URL, userName: 'Sonia', language }),
    passwordResetEmail({ resetUrl: RESET_URL, userName: 'Sonia', language }),
    recurringExpenseAlertEmail({
      userName: 'Sonia',
      description: 'Alquiler',
      amount: 1234.5,
      dueDate: '2026-03-04',
      sheetUrl: 'https://spendio.soniadev.es/expenses',
      language,
    }),
    recurringExpenseDeactivatedEmail({
      userName: 'Sonia',
      description: 'Alquiler',
      sheetName: 'Casa',
      language,
    }),
  ];
}

describe.each(SUPPORTED_LANGUAGES)('every email in %s', (language) => {
  const emails = buildAll(language);

  it('has a non-empty subject, html and text', () => {
    for (const email of emails) {
      expect(email.subject.trim()).not.toBe('');
      expect(email.html.trim()).not.toBe('');
      expect(email.text.trim()).not.toBe('');
    }
  });

  it('greets the user and never leaves a dangling comma', () => {
    for (const email of emails) {
      expect(email.text).toContain('Sonia,');
    }
  });

  it('includes the footer once', () => {
    for (const email of emails) {
      expect(email.html.match(/Spendio —/g)).toHaveLength(1);
    }
  });

  it('leaves no unresolved template placeholders', () => {
    for (const email of emails) {
      expect(email.html).not.toContain('${');
      expect(email.text).not.toContain('${');
      expect(email.subject).not.toContain('${');
    }
  });
});

describe('language selection', () => {
  it('writes Spanish copy for es', () => {
    const { subject, html, text } = passwordResetEmail({
      resetUrl: RESET_URL,
      userName: 'Sonia',
      language: Language.Spanish,
    });

    expect(subject).toBe('Restablecer tu contraseña de Spendio');
    expect(html).toContain('Hola Sonia,');
    expect(text).toContain('Este enlace caduca en 30 minutos.');
  });

  it('writes English copy for en', () => {
    const { subject, html, text } = passwordResetEmail({
      resetUrl: RESET_URL,
      userName: 'Sonia',
      language: Language.English,
    });

    expect(subject).toBe('Reset your Spendio password');
    expect(html).toContain('Hi Sonia,');
    expect(text).toContain('This link expires in 30 minutes.');
  });

  it('handles an empty user name without a dangling space', () => {
    const { html } = passwordResetEmail({
      resetUrl: RESET_URL,
      userName: '',
      language: Language.Spanish,
    });

    expect(html).toContain('<p>Hola,</p>');
  });
});

describe('recurring reminder formatting', () => {
  it('formats amount and date the Spanish way', () => {
    const { subject } = recurringExpenseAlertEmail({
      userName: 'Sonia',
      description: 'Alquiler',
      amount: 1234.5,
      dueDate: '2026-03-04',
      sheetUrl: 'https://example.test',
      language: Language.Spanish,
    });

    expect(subject).toContain('1234,50');
    expect(subject).toContain('04/03/2026');
  });

  it('formats amount and date the English way', () => {
    const { subject } = recurringExpenseAlertEmail({
      userName: 'Sonia',
      description: 'Rent',
      amount: 1234.5,
      dueDate: '2026-03-04',
      sheetUrl: 'https://example.test',
      language: Language.English,
    });

    expect(subject).toContain('€1,234.50');
    expect(subject).toContain('03/04/2026');
  });

  it('does not shift the day across time zones', () => {
    const { subject } = recurringExpenseAlertEmail({
      userName: 'Sonia',
      description: 'Alquiler',
      amount: 10,
      dueDate: '2026-01-01',
      sheetUrl: 'https://example.test',
      language: Language.Spanish,
    });

    expect(subject).toContain('01/01/2026');
  });
});
