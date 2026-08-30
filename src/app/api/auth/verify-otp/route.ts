import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const OTP_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

function verifySessionToken(sessionId: string, inputOtp: string, inputMembershipId: string): { valid: boolean; membershipId?: string; error?: string } {
  try {
    const raw = Buffer.from(sessionId, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 5) {
      return { valid: false, error: 'Invalid or corrupted session format.' };
    }

    const [tokenMemberId, tokenOtp, expiresAtStr, tokenEmail, tokenHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    const payload = `${tokenMemberId}:${tokenOtp}:${expiresAtStr}:${tokenEmail}`;
    const expectedHmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');

    const hmacBuf = Buffer.from(tokenHmac);
    const expBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expBuf.length || !crypto.timingSafeEqual(hmacBuf, expBuf)) {
      return { valid: false, error: 'Invalid verification session token.' };
    }

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, error: 'OTP code has expired. Please request a new code.' };
    }

    if (tokenMemberId.toLowerCase() !== inputMembershipId.trim().toLowerCase()) {
      return { valid: false, error: 'Session mismatch. Please request a new OTP.' };
    }

    if (tokenOtp !== inputOtp.trim()) {
      return { valid: false, error: 'Incorrect OTP code. Please check your Gmail and try again.' };
    }

    return { valid: true, membershipId: tokenMemberId };
  } catch {
    return { valid: false, error: 'Invalid session token. Please try again.' };
  }
}

function createResetToken(membershipId: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000;
  const payload = `${membershipId.trim().toLowerCase()}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, otp, membershipId, memberId, username } = body;
    const effectiveId = (membershipId || memberId || username || '').trim();

    if (!sessionId || !sessionId.trim()) {
      return NextResponse.json(
        { error: 'Session expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit OTP sent to your Gmail.' },
        { status: 400 }
      );
    }

    if (!effectiveId) {
      return NextResponse.json(
        { error: 'Membership ID is required.' },
        { status: 400 }
      );
    }

    const verification = verifySessionToken(sessionId, otp, effectiveId);

    if (!verification.valid || !verification.membershipId) {
      return NextResponse.json(
        { error: verification.error || 'Incorrect OTP code. Please try again.' },
        { status: 400 }
      );
    }

    const resetToken = createResetToken(verification.membershipId);

    return NextResponse.json({
      success: true,
      resetToken,
      message: 'OTP verified successfully. Please set your new password.',
    });
  } catch (err: any) {
    console.error('[verify-otp] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred during OTP verification.' },
      { status: 500 }
    );
  }
}
