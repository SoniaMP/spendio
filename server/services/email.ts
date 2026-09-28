import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@spendio.app';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailDeliveryError extends Error {
  constructor(reason: string) {
    super(`Email delivery failed: ${reason}`);
    this.name = 'EmailDeliveryError';
  }
}

/**
 * The Resend SDK reports API failures in the returned `error` field instead of
 * throwing, so an unverified sender domain or a bad key used to look exactly
 * like a successful send. Surface it.
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });

  if (error) {
    console.error('Resend rejected the email', {
      to: payload.to,
      from: FROM_EMAIL,
      name: error.name,
      message: error.message,
    });
    throw new EmailDeliveryError(error.message);
  }
}
