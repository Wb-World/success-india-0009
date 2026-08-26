import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: Request) {
  console.log('[reset-password] Request received');

  try {
    const { token, newPassword } = await request.json();
    console.log('[reset-password] Payload received, token present:', !!token);

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);

    // Find user by token hash
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, username, reset_token, reset_token_expires_at')
      .eq('reset_token', tokenHash)
      .maybeSingle();

    if (fetchError || !user) {
      console.error('[reset-password] Token not found:', fetchError);
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 }
      );
    }

    // Check expiry
    const expiresAt = new Date(user.reset_token_expires_at).getTime();
    const now = Date.now();
    if (now > expiresAt) {
      console.error('[reset-password] Token expired for user:', user.id);
      // Clear expired token
      await supabaseAdmin
        .from('users')
        .update({ reset_token: null, reset_token_expires_at: null })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = hashPassword(newPassword);

    // Update password and clear reset token
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[reset-password] Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again.' },
        { status: 500 }
      );
    }

    console.log('[reset-password] Password updated successfully for user:', user.id);
    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err: any) {
    console.error('[reset-password] API error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
