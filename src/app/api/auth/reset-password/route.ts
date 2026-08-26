import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getPhoneDigitsOnly(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

/**
 * Parses and verifies basic claims of a Firebase ID Token payload
 */
function parseJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { username, newPassword, idToken } = await request.json();

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

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing Firebase authentication token. Please verify OTP first.' },
        { status: 401 }
      );
    }

    const cleanUsername = username.trim();

    // Verify Firebase token payload
    const payload = parseJwtPayload(idToken);
    if (!payload || !payload.phone_number) {
      return NextResponse.json(
        { error: 'Invalid authentication session. Please verify OTP again.' },
        { status: 401 }
      );
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return NextResponse.json(
        { error: 'Your OTP verification session has expired. Please verify OTP again.' },
        { status: 401 }
      );
    }

    // Find user in database
    const { data: dbUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, phone')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (userError || !dbUser) {
      return NextResponse.json(
        { error: 'Account not found.' },
        { status: 404 }
      );
    }

    // Ensure phone number in token matches user's registered phone number
    const tokenPhoneDigits = getPhoneDigitsOnly(payload.phone_number);
    const dbPhoneDigits = getPhoneDigitsOnly(dbUser.phone);

    if (tokenPhoneDigits !== dbPhoneDigits) {
      return NextResponse.json(
        { error: 'Verified phone number does not match this user account.' },
        { status: 403 }
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
