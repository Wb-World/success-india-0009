import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const RESET_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

function verifyResetToken(token: string, expectedMemberId: string): boolean {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 3) return false;

    const [tokenMemberId, expiresAtStr, tokenHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
    if (tokenMemberId.toLowerCase() !== expectedMemberId.trim().toLowerCase()) return false;

    const payload = `${tokenMemberId}:${expiresAtStr}`;
    const expectedHmac = crypto.createHmac('sha256', RESET_SECRET).update(payload).digest('hex');

    const hmacBuf = Buffer.from(tokenHmac);
    const expBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expBuf.length) return false;

    return crypto.timingSafeEqual(hmacBuf, expBuf);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { membershipId, memberId, username, newPassword, token } = body;
    const effectiveMemberId = (membershipId || memberId || username || '').trim();

    if (!effectiveMemberId) {
      return NextResponse.json(
        { error: 'Member ID is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing verification session. Please verify OTP again.' },
        { status: 401 }
      );
    }

    const isValidToken = verifyResetToken(token, effectiveMemberId);
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Verification session has expired or is invalid. Please verify OTP again.' },
        { status: 401 }
      );
    }

    // Find user in Supabase database by member_id
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, member_id')
      .ilike('member_id', effectiveMemberId)
      .maybeSingle();

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'Account not found for this Member ID.' },
        { status: 404 }
      );
    }

    // Hash new password and update in Supabase
    const hashedPassword = hashPassword(newPassword);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
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
