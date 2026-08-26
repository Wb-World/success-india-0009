import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Normalizes phone numbers to standard 10-digit suffix for comparison
 */
function getPhoneDigitsOnly(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-10);
}

/**
 * Formats a phone number into international E.164 format (e.g. +919876543210)
 */
function formatE164(phone: string): string {
  const cleaned = (phone || '').trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/** Mask phone number: show only last 4 digits */
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

    // Return the formatted E.164 phone number for Firebase Phone Auth
    const e164Phone = formatE164(cleanPhone);

    return NextResponse.json({
      success: true,
      phoneNumber: e164Phone,
      maskedPhone: maskPhone(dbUser.phone),
      message: 'Account verified. Sending OTP via Firebase...',
    });
  } catch (err: any) {
    console.error('[forgot-password] Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
