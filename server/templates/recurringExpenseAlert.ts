interface RecurringExpenseAlertParams {
  userName: string;
  description: string;
  amount: number;
  dueDate: string;
  sheetUrl: string;
}

function formatDateEs(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function formatAmountEs(amount: number): string {
  return amount.toFixed(2).replace('.', ',');
}

export function recurringExpenseAlertEmail({
  userName,
  description,
  amount,
  dueDate,
  sheetUrl,
}: RecurringExpenseAlertParams) {
  const formattedDate = formatDateEs(dueDate);
  const formattedAmount = formatAmountEs(amount);
  const subject = `Recordatorio: ${description} - ${formattedAmount}€ el ${formattedDate}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Gasto recurrente próximo</h2>
      <p>Hola ${userName || ''},</p>
      <p>Te recordamos que tienes un gasto recurrente programado:</p>
      <ul style="background: #f9fafb; padding: 16px 24px; border-radius: 6px; list-style: none;">
        <li><strong>${description}</strong></li>
        <li>Importe: <strong>${formattedAmount}€</strong></li>
        <li>Fecha: <strong>${formattedDate}</strong></li>
      </ul>
      <a href="${sheetUrl}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Ver hoja
      </a>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Spendio — Controla tus gastos, visualiza tu dinero</p>
    </div>
  `.trim();

  const text = [
    `Hola ${userName || ''},`,
    '',
    'Te recordamos que tienes un gasto recurrente programado:',
    '',
    `- ${description}`,
    `- Importe: ${formattedAmount}€`,
    `- Fecha: ${formattedDate}`,
    '',
    `Ver hoja: ${sheetUrl}`,
  ].join('\n');

  return { subject, html, text };
}
