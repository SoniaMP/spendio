import { Language } from '../../shared/languages.ts';
import { greeting, renderEmailLayout } from './emailLayout.ts';

interface RecurringExpenseDeactivatedParams {
  userName: string;
  description: string;
  sheetName: string;
  language: Language;
}

const COPY: Record<
  Language,
  {
    subject: (description: string) => string;
    heading: string;
    reason: (description: string, sheetName: string) => string;
    reasonText: (description: string, sheetName: string) => string;
    hint: string;
  }
> = {
  [Language.Spanish]: {
    subject: (description) => `Tu gasto recurrente "${description}" se ha desactivado`,
    heading: 'Gasto recurrente desactivado',
    reason: (description, sheetName) =>
      `Hemos desactivado tu gasto recurrente <strong>${description}</strong> porque has perdido acceso a la hoja <strong>${sheetName}</strong>.`,
    reasonText: (description, sheetName) =>
      `Hemos desactivado tu gasto recurrente "${description}" porque has perdido acceso a la hoja "${sheetName}".`,
    hint: 'Si recuperas el acceso podrás reactivarlo manualmente desde el modal de gastos recurrentes.',
  },
  [Language.English]: {
    subject: (description) => `Your recurring expense "${description}" was deactivated`,
    heading: 'Recurring expense deactivated',
    reason: (description, sheetName) =>
      `We deactivated your recurring expense <strong>${description}</strong> because you lost access to the sheet <strong>${sheetName}</strong>.`,
    reasonText: (description, sheetName) =>
      `We deactivated your recurring expense "${description}" because you lost access to the sheet "${sheetName}".`,
    hint: 'If you regain access you can reactivate it manually from the recurring expenses dialog.',
  },
};

export function recurringExpenseDeactivatedEmail({
  userName,
  description,
  sheetName,
  language,
}: RecurringExpenseDeactivatedParams) {
  const copy = COPY[language];
  const hello = greeting(language, userName);

  const html = renderEmailLayout({
    language,
    heading: copy.heading,
    body: `
      <p>${hello}</p>
      <p>${copy.reason(description, sheetName)}</p>
      <p>${copy.hint}</p>`,
  });

  const text = [
    hello,
    '',
    copy.reasonText(description, sheetName),
    '',
    copy.hint,
  ].join('\n');

  return { subject: copy.subject(description), html, text };
}
