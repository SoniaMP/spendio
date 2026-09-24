import { Language } from '../../shared/languages.ts';
import { greeting, renderEmailLayout } from './emailLayout.ts';

interface RecurringExpenseAlertParams {
  userName: string;
  description: string;
  amount: number;
  dueDate: string;
  sheetUrl: string;
  language: Language;
}

// Same rule as the UI: the currency stays EUR, only the formatting changes.
const INTL_LOCALES: Record<Language, string> = {
  [Language.Spanish]: 'es-ES',
  [Language.English]: 'en-US',
};

const COPY: Record<
  Language,
  {
    subject: (description: string, amount: string, date: string) => string;
    heading: string;
    intro: string;
    amountLabel: string;
    dateLabel: string;
    action: string;
  }
> = {
  [Language.Spanish]: {
    subject: (description, amount, date) =>
      `Recordatorio: ${description} - ${amount} el ${date}`,
    heading: 'Gasto recurrente próximo',
    intro: 'Te recordamos que tienes un gasto recurrente programado:',
    amountLabel: 'Importe',
    dateLabel: 'Fecha',
    action: 'Ver hoja',
  },
  [Language.English]: {
    subject: (description, amount, date) =>
      `Reminder: ${description} - ${amount} on ${date}`,
    heading: 'Upcoming recurring expense',
    intro: 'A reminder that you have a recurring expense scheduled:',
    amountLabel: 'Amount',
    dateLabel: 'Date',
    action: 'View sheet',
  },
};

function formatAmount(amount: number, language: Language): string {
  return new Intl.NumberFormat(INTL_LOCALES[language], {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(isoDate: string, language: Language): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL_LOCALES[language], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function recurringExpenseAlertEmail({
  userName,
  description,
  amount,
  dueDate,
  sheetUrl,
  language,
}: RecurringExpenseAlertParams) {
  const copy = COPY[language];
  const hello = greeting(language, userName);
  const formattedAmount = formatAmount(amount, language);
  const formattedDate = formatDate(dueDate, language);

  const html = renderEmailLayout({
    language,
    heading: copy.heading,
    body: `
      <p>${hello}</p>
      <p>${copy.intro}</p>
      <ul style="background: #f9fafb; padding: 16px 24px; border-radius: 6px; list-style: none;">
        <li><strong>${description}</strong></li>
        <li>${copy.amountLabel}: <strong>${formattedAmount}</strong></li>
        <li>${copy.dateLabel}: <strong>${formattedDate}</strong></li>
      </ul>`,
    cta: { url: sheetUrl, label: copy.action },
  });

  const text = [
    hello,
    '',
    copy.intro,
    '',
    `- ${description}`,
    `- ${copy.amountLabel}: ${formattedAmount}`,
    `- ${copy.dateLabel}: ${formattedDate}`,
    '',
    `${copy.action}: ${sheetUrl}`,
  ].join('\n');

  return {
    subject: copy.subject(description, formattedAmount, formattedDate),
    html,
    text,
  };
}
