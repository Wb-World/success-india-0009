import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const RESET_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

/**
 * Validates the reset token signature and expiration
 */
function verifyResetToken(token: string, expectedUsername: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;

    const [tokenUsername, expiresAtStr, tokenHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }

    if (tokenUsername.toLowerCase() !== expectedUsername.trim().toLowerCase()) {
      return false;
    }

    const payload = `${tokenUsername}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac('sha256', RESET_SECRET).update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(tokenHmac), Buffer.from(expectedHmac));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { username, newPassword, token } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'Username is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number.' },
        { status: 400 }
      );
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character.' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing verification session. Please verify OTP again.' },
        { status: 401 }
      );
    }

    const cleanUsername = username.trim();

    // Verify token signature
    const isValidToken = verifyResetToken(token, cleanUsername);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Verification session has expired or is invalid. Please verify OTP again.' },
        { status: 401 }
      );
    }

    // Find user in database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Hash new password and update in Supabase
    const hashedPassword = hashPassword(newPassword);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq('id', dbUser.id);

    if (updateError) {
      console.error('[reset-password] Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err: any) {
    console.error('[reset-password] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
