import { Language } from '../../shared/languages.ts';

const FOOTER: Record<Language, string> = {
  [Language.Spanish]: 'Spendio — Controla tus gastos, visualiza tu dinero',
  [Language.English]: 'Spendio — Track your spending, see where your money goes',
};

interface EmailLayoutParams {
  language: Language;
  heading: string;
  /** Already-built HTML for the body of the message. */
  body: string;
  cta?: { url: string; label: string };
  /** Small print shown after the call to action. */
  note?: string;
}

/**
 * The shell every email shares: wrapper, heading, optional call-to-action
 * button, optional small print and footer. Kept in one place so the four
 * templates do not each carry their own copy of the markup.
 */
export function renderEmailLayout({
  language,
  heading,
  body,
  cta,
  note,
}: EmailLayoutParams): string {
  const button = cta
    ? `
      <a href="${cta.url}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        ${cta.label}
      </a>`
    : '';

  const smallPrint = note
    ? `
      <p style="color: #666; font-size: 14px;">${note}</p>`
    : '';

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">${heading}</h2>
      ${body}${button}${smallPrint}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">${FOOTER[language]}</p>
    </div>
  `.trim();
}

export function greeting(language: Language, userName: string): string {
  const hello = language === Language.English ? 'Hi' : 'Hola';
  return userName ? `${hello} ${userName},` : `${hello},`;
}
