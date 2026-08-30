import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { sendGmailOtp } from '@/lib/nodemailer';

export const dynamic = 'force-dynamic';

const OTP_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****@gmail.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local.charAt(0)}***@${domain}`;
  }
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}@${domain}`;
}

function createOtpSessionToken(membershipId: string, otp: string, toEmail: string): string {
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const payload = `${membershipId.trim().toLowerCase()}:${otp.trim()}:${expiresAt}:${toEmail.trim().toLowerCase()}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const membershipId = (body.membershipId || body.memberId || body.username || '').trim();
    const inputEmail = (body.email || body.mailId || '').trim();

    if (!membershipId) {
      return NextResponse.json(
        { error: 'Member ID is required.' },
        { status: 400 }
      );
    }

    if (!inputEmail || !inputEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid Mail ID (Gmail) is required.' },
        { status: 400 }
      );
    }

    // Look up user by member_id
    let { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('id, member_id, name, phone, email')
      .ilike('member_id', membershipId)
      .maybeSingle();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: 'No account found with this Member ID.' },
        { status: 404 }
      );
    }

    // Target email to send OTP
    const targetEmail = inputEmail;

    // Save user's email if not already present in DB
    if (!dbUser.email) {
      await supabaseAdmin
        .from('users')
        .update({ email: targetEmail })
        .eq('id', dbUser.id);
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const effectiveMemberId = dbUser.member_id;

    // Send OTP via Gmail SMTP or Resend
    const emailResult = await sendGmailOtp(targetEmail, otpCode, effectiveMemberId);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to dispatch Gmail OTP. Please check your Mail ID and try again.' },
        { status: 500 }
      );
    }

    // Generate signed session token
    const sessionId = createOtpSessionToken(effectiveMemberId, otpCode, targetEmail);
    const masked = maskEmail(targetEmail);

    let message = `OTP sent successfully to your Gmail (${masked}).`;
    if (emailResult.simulated) {
      message = `[Demo Mode] OTP for ${effectiveMemberId}: ${otpCode} (Configure GMAIL_USER & GMAIL_PASS in .env.local to send live emails).`;
    }

    return NextResponse.json({
      success: true,
      sessionId,
      maskedEmail: masked,
      simulated: emailResult.simulated || false,
      debugOtp: emailResult.simulated ? otpCode : undefined,
      message,
    });
  } catch (err: any) {
    console.error('[forgot-password] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
