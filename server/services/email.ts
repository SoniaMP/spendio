import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@spendio.app';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
