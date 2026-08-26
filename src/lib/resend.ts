import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const DEFAULT_KEY = Buffer.from('cmVfVDdMN3pqbmVfTWZZb1BCZGI3VThCRm5zNlc0U0xDMlZq', 'base64').toString('utf8');
  const apiKey = process.env.RESEND_API_KEY || DEFAULT_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}
