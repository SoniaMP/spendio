interface PasswordResetEmailParams {
  resetUrl: string;
  userName: string;
}

export function passwordResetEmail({ resetUrl, userName }: PasswordResetEmailParams) {
  const subject = 'Restablecer tu contraseña de Spendio';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Restablecer contraseña</h2>
      <p>Hola ${userName || ''},</p>
      <p>Recibimos una solicitud para restablecer tu contraseña de Spendio. Haz clic en el botón para establecer una nueva contraseña:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Restablecer contraseña
      </a>
      <p style="color: #666; font-size: 14px;">Este enlace caduca en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Spendio — Controla tus gastos, visualiza tu dinero</p>
    </div>
  `.trim();

  const text = [
    `Hola ${userName || ''},`,
    '',
    'Recibimos una solicitud para restablecer tu contraseña de Spendio.',
    'Haz clic en el enlace para establecer una nueva contraseña:',
    '',
    resetUrl,
    '',
    'Este enlace caduca en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.',
  ].join('\n');

  return { subject, html, text };
}
