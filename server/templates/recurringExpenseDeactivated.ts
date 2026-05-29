interface RecurringExpenseDeactivatedParams {
  userName: string;
  description: string;
  sheetName: string;
}

export function recurringExpenseDeactivatedEmail({
  userName,
  description,
  sheetName,
}: RecurringExpenseDeactivatedParams) {
  const subject = `Tu gasto recurrente "${description}" se ha desactivado`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Gasto recurrente desactivado</h2>
      <p>Hola ${userName || ''},</p>
      <p>Hemos desactivado tu gasto recurrente <strong>${description}</strong> porque has perdido acceso a la hoja <strong>${sheetName}</strong>.</p>
      <p>Si recuperas el acceso podrás reactivarlo manualmente desde el modal de gastos recurrentes.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Spendio — Controla tus gastos, visualiza tu dinero</p>
    </div>
  `.trim();

  const text = [
    `Hola ${userName || ''},`,
    '',
    `Hemos desactivado tu gasto recurrente "${description}" porque has perdido acceso a la hoja "${sheetName}".`,
    '',
    'Si recuperas el acceso podrás reactivarlo manualmente desde el modal de gastos recurrentes.',
  ].join('\n');

  return { subject, html, text };
}
