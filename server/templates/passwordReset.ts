interface PasswordResetEmailParams {
  resetUrl: string;
  userName: string;
}

export function passwordResetEmail({ resetUrl, userName }: PasswordResetEmailParams) {
  const subject = 'Reset your Spendio password';

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Password Reset</h2>
      <p>Hi ${userName || 'there'},</p>
      <p>We received a request to reset your Spendio password. Click the button below to set a new password:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 14px;">This link expires in 30 minutes. If you did not request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">Spendio — Controla tus gastos, visualiza tu dinero</p>
    </div>
  `.trim();

  const text = [
    `Hi ${userName || 'there'},`,
    '',
    'We received a request to reset your Spendio password.',
    'Click the link below to set a new password:',
    '',
    resetUrl,
    '',
    'This link expires in 30 minutes. If you did not request this, you can safely ignore this email.',
  ].join('\n');

  return { subject, html, text };
}
