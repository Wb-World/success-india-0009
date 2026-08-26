import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyTwoFactorOtp } from '@/lib/twofactor';

export const dynamic = 'force-dynamic';

const RESET_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

/**
 * Creates a tamper-proof reset token without storing in database
 */
function createResetToken(username: string): string {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  const payload = `${username.trim().toLowerCase()}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', RESET_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

export async function POST(request: Request) {
  try {
    const { sessionId, otp, username } = await request.json();

    if (!sessionId || !sessionId.trim()) {
      return NextResponse.json(
        { error: 'Session expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    if (!otp || !otp.trim()) {
      return NextResponse.json(
        { error: 'Please enter the OTP.' },
        { status: 400 }
      );
    }

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'Username is required.' },
        { status: 400 }
      );
    }

    // Verify OTP directly with 2Factor.in API
    const verifyResult = await verifyTwoFactorOtp(sessionId.trim(), otp.trim());

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Incorrect OTP code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Generate signed reset token
    const resetToken = createResetToken(username.trim());

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
