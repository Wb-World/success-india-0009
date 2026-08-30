import { getResendClient } from './resend';
import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const OTP_TEMPLATE = (otp: string, membershipId: string) => `
<div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px; background: linear-gradient(135deg, #16a34a, #15803d); padding: 18px; border-radius: 12px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Success Team Portal</h1>
  </div>
  <h2 style="color: #1f2937; font-size: 18px;">Password Reset Verification</h2>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hello,</p>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
    You requested a password reset for Member ID: <strong style="color: #16a34a;">${membershipId}</strong>.
  </p>
  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
    Please use the following 6-digit One-Time Password (OTP) to verify your identity:
  </p>
  <div style="text-align: center; margin: 28px 0;">
    <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #15803d; background-color: #f0fdf4; padding: 14px 28px; border-radius: 12px; border: 2px dashed #16a34a; display: inline-block;">
      ${otp}
    </span>
  </div>
  <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px;">
    <p style="color: #854d0e; font-size: 13px; margin: 0; font-weight: 600;">
      ⚠️ This code is valid for <strong>10 minutes</strong>. Do not share it with anyone.
    </p>
  </div>
  <p style="color: #6b7280; font-size: 14px;">If you did not request this, please ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">© 2026 Accsys India. All rights reserved.</p>
</div>
`;

/**
 * Sends OTP email.
 * Order: Resend API (from: Accsys India) → Gmail SMTP fallback → Console/demo.
 */
export async function sendGmailOtp(
  toEmail: string,
  otp: string,
  membershipId: string
): Promise<{ success: boolean; provider?: string; simulated?: boolean; error?: string }> {
  const to = toEmail.trim();
  // Subject does NOT expose the OTP code
  const subject = `Password Reset Verification – Success Team Portal`;
  const html = OTP_TEMPLATE(otp, membershipId);

  // ── Method 1: Resend API (primary — sends from Accsys India, not personal Gmail) ──
  try {
    const resend = getResendClient();
    const res = await resend.emails.send({
      from: 'Accsys India <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (res.data?.id) {
      console.log(`[OTP Email] ✅ Sent via Resend to ${to} (id: ${res.data.id})`);
      return { success: true, provider: 'resend' };
    }

    if (res.error) {
      console.error('[OTP Email] Resend error:', JSON.stringify(res.error));
    }
  } catch (resendErr: any) {
    console.error('[OTP Email] Resend exception:', resendErr?.message || resendErr);
  }

  // ── Method 2: Gmail SMTP fallback ───────────────────────────────────────────
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || '').replace(/\s+/g, '');

  if (smtpUser && smtpPass) {
    try {
      transporter = null;
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
      });

      await transporter.sendMail({
        from: `"Accsys India (No Reply)" <${smtpUser}>`,
        to,
        subject,
        html,
      });

      console.log(`[OTP Email] ✅ Sent via Gmail SMTP fallback to ${to}`);
      return { success: true, provider: 'smtp' };
    } catch (smtpErr: any) {
      console.error('[OTP Email] ❌ Gmail SMTP failed:', smtpErr.message);
      transporter = null;
    }
  }

  // ── Method 3: Console/demo fallback ─────────────────────────────────────────
  console.warn('═══════════════════════════════════════════════════════');
  console.warn('[OTP Email] ⚠️  DEMO MODE — email NOT delivered.');
  console.warn(`[OTP Email] Member ID : ${membershipId}`);
  console.warn(`[OTP Email] To Email  : ${to}`);
  console.warn(`[OTP Email] OTP Code  : ${otp}`);
  console.warn('═══════════════════════════════════════════════════════');

  return { success: true, simulated: true };
}
