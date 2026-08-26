import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendTwoFactorOtp } from '@/lib/twofactor';

export const dynamic = 'force-dynamic';

function getPhoneDigitsOnly(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return `****${phone.slice(-4)}`;
}

export async function POST(request: Request) {
  try {
    const { username, phone } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: 'Username is required.' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone.trim();
    const phoneDigits = getPhoneDigitsOnly(cleanPhone);

    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    // Look up user by username (case-insensitive)
    const { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('id, username, name, phone')
      .ilike('username', cleanUsername)
      .maybeSingle();

    if (error || !dbUser) {
      return NextResponse.json(
        { error: 'No account found with this username.' },
        { status: 404 }
      );
    }

    if (!dbUser.phone) {
      return NextResponse.json(
        { error: 'No mobile number registered with this account. Please contact support.' },
        { status: 400 }
      );
    }

    // Compare 10-digit mobile numbers
    const dbPhoneDigits = getPhoneDigitsOnly(dbUser.phone);
    if (dbPhoneDigits !== phoneDigits) {
      return NextResponse.json(
        { error: 'The phone number does not match the registered number for this username.' },
        { status: 400 }
      );
    }

    // Send OTP via 2Factor.in SMS Gateway (No DB storage of OTP)
    const smsResult = await sendTwoFactorOtp(phoneDigits);

    if (!smsResult.success || !smsResult.sessionId) {
      return NextResponse.json(
        { error: smsResult.error || 'Failed to dispatch SMS OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: smsResult.sessionId,
      maskedPhone: maskPhone(dbUser.phone),
      message: `OTP sent successfully to your mobile number ending in ${maskPhone(dbUser.phone)}.`,
    });
  } catch (err: any) {
    console.error('[forgot-password] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
