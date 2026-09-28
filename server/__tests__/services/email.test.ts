import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend };
  },
}));

import { sendEmail, EmailDeliveryError } from '../../services/email.ts';

const payload = {
  to: 'someone@example.test',
  subject: 'Subject',
  html: '<p>body</p>',
  text: 'body',
};

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('resolves when the provider accepts the email', async () => {
    mockSend.mockResolvedValue({ data: { id: 'abc' }, error: null });

    await expect(sendEmail(payload)).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining(payload));
  });

  // The SDK reports failures in `error` rather than throwing, so without this
  // an unverified sender domain looked exactly like a successful send.
  it('throws when the provider rejects the email', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: {
        statusCode: 403,
        name: 'validation_error',
        message: 'The example.com domain is not verified.',
      },
    });

    await expect(sendEmail(payload)).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it('keeps the provider reason in the thrown message', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { statusCode: 401, name: 'auth_error', message: 'API key is invalid' },
    });

    await expect(sendEmail(payload)).rejects.toThrow('API key is invalid');
  });

  it('logs the rejection with the addresses involved', async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { statusCode: 403, name: 'validation_error', message: 'nope' },
    });

    await expect(sendEmail(payload)).rejects.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Resend rejected the email',
      expect.objectContaining({ to: payload.to, message: 'nope' }),
    );
  });
});
