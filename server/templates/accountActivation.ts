interface AccountActivationEmailParams {
  resetUrl: string;
  userName: string;
}

export function accountActivationEmail({ resetUrl, userName }: AccountActivationEmailParams) {
  const subject = 'Activa tu cuenta de Spendio';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">¡Bienvenido a Spendio!</h2>
      <p>Hola ${userName || ''},</p>
      <p>Alguien compartió una hoja de gastos contigo en Spendio. Establece una contraseña para activar tu cuenta y empezar a colaborar:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Activar cuenta
      </a>
      <p style="color: #666; font-size: 14px;">Este enlace caduca en 30 minutos. Si no esperabas este correo, puedes ignorarlo.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Spendio — Controla tus gastos, visualiza tu dinero</p>
    </div>
  `.trim();

  const text = [
    `Hola ${userName || ''},`,
    '',
    'Alguien compartió una hoja de gastos contigo en Spendio.',
    'Establece una contraseña para activar tu cuenta y empezar a colaborar:',
    '',
    resetUrl,
    '',
    'Este enlace caduca en 30 minutos. Si no esperabas este correo, puedes ignorarlo.',
  ].join('\n');

  return { subject, html, text };
}
