import { Language } from '../../shared/languages.ts';
import { greeting, renderEmailLayout } from './emailLayout.ts';

interface PasswordResetEmailParams {
  resetUrl: string;
  userName: string;
  language: Language;
}

const COPY: Record<
  Language,
  { subject: string; heading: string; intro: string; action: string; expiry: string }
> = {
  [Language.Spanish]: {
    subject: 'Restablecer tu contraseña de Spendio',
    heading: 'Restablecer contraseña',
    intro:
      'Recibimos una solicitud para restablecer tu contraseña de Spendio. Haz clic en el botón para establecer una nueva contraseña:',
    action: 'Restablecer contraseña',
    expiry:
      'Este enlace caduca en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.',
  },
  [Language.English]: {
    subject: 'Reset your Spendio password',
    heading: 'Reset password',
    intro:
      'We received a request to reset your Spendio password. Click the button to set a new one:',
    action: 'Reset password',
    expiry:
      'This link expires in 30 minutes. If you did not request this change, you can ignore this email.',
  },
};

export function passwordResetEmail({
  resetUrl,
  userName,
  language,
}: PasswordResetEmailParams) {
  const copy = COPY[language];
  const hello = greeting(language, userName);

  const html = renderEmailLayout({
    language,
    heading: copy.heading,
    body: `
      <p>${hello}</p>
      <p>${copy.intro}</p>`,
    cta: { url: resetUrl, label: copy.action },
    note: copy.expiry,
  });

  const text = [hello, '', copy.intro, '', resetUrl, '', copy.expiry].join('\n');

  return { subject: copy.subject, html, text };
}
