import { Language } from '../../shared/languages.ts';
import { greeting, renderEmailLayout } from './emailLayout.ts';

interface AccountActivationEmailParams {
  resetUrl: string;
  userName: string;
  language: Language;
}

const COPY: Record<
  Language,
  { subject: string; heading: string; intro: string; action: string; expiry: string }
> = {
  [Language.Spanish]: {
    subject: 'Activa tu cuenta de Spendio',
    heading: '¡Bienvenido a Spendio!',
    intro:
      'Alguien compartió una hoja de gastos contigo en Spendio. Establece una contraseña para activar tu cuenta y empezar a colaborar:',
    action: 'Activar cuenta',
    expiry:
      'Este enlace caduca en 30 minutos. Si no esperabas este correo, puedes ignorarlo.',
  },
  [Language.English]: {
    subject: 'Activate your Spendio account',
    heading: 'Welcome to Spendio!',
    intro:
      'Someone shared an expense sheet with you on Spendio. Set a password to activate your account and start collaborating:',
    action: 'Activate account',
    expiry:
      'This link expires in 30 minutes. If you were not expecting this email, you can ignore it.',
  },
};

export function accountActivationEmail({
  resetUrl,
  userName,
  language,
}: AccountActivationEmailParams) {
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
