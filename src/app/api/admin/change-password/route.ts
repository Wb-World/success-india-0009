import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth';
import { 
  verifyAdminSession, 
  checkRateLimit, 
  recordFailure, 
  resetRateLimit 
} from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Password policy checks
function validatePasswordStrength(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) return false;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  try {
    // 1. Rate limiting check
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      const minutesLeft = Math.ceil((rateCheck.blockedUntil! - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { error: `Too many failed attempts. Temporarily blocked. Try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    // 2. Session verification
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
    }

    // 3. Parse input body safely
    const body = await request.json();
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // 4. Prevent reusing current password
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'New password cannot be the same as your current password.' }, { status: 400 });
    }

    // 5. Password strength policy verification
    if (!validatePasswordStrength(newPassword)) {
      return NextResponse.json(
        { error: 'New password does not meet complexity requirements. It must contain at least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character.' },
        { status: 400 }
      );
    }

    // 6. Fetch database record with credentials
    const { data: adminRecord, error: fetchError } = await supabaseAdmin
      .from('admin')
      .select('id, username, password')
      .eq('id', adminUser.id)
      .maybeSingle();

    if (fetchError || !adminRecord) {
      console.error('[Change Password] Admin retrieval error:', fetchError);
      return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }

    // 7. Verify the current password
    if (!verifyPassword(currentPassword, adminRecord.password)) {
      const failures = recordFailure(ip);
      const remainingAttempts = failures.remaining;
      
      let errorMsg = 'Current password is incorrect.';
      if (remainingAttempts === 0) {
        errorMsg += ' Too many failed attempts. You have been temporarily blocked for 15 minutes.';
      } else {
        errorMsg += ` You have ${remainingAttempts} attempts remaining before temporary lockout.`;
      }

      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // 8. Hash password using bcrypt (12 salt rounds)
    const newHash = bcrypt.hashSync(newPassword, 12);

    // 9. Update DB with hashed password
    const { error: updateError } = await supabaseAdmin
      .from('admin')
      .update({ password: newHash })
      .eq('id', adminUser.id);

    if (updateError) {
      console.error('[Change Password] Database update error:', updateError);
      return NextResponse.json({ error: 'Failed to update database with new keys.' }, { status: 500 });
    }

    // 10. Success: reset rate limit and clear secure cookie to terminate session
    resetRateLimit(ip);

    const response = NextResponse.json({ 
      success: true, 
      message: 'Password updated successfully.' 
    });

    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error('[Change Password] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
