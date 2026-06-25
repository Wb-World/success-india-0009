import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword } from '@/lib/auth';
import { signAdminToken } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query the dedicated admin table only — never touches the users table
    const { data: admin, error } = await supabaseAdmin
      .from('admin')
      .select('id, username, password, role')
      .ilike('username', username)
      .maybeSingle();

    if (error) {
      console.error('[Admin Login] Supabase error:', error);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, admin.password)) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate secure admin JWT session token
    const token = signAdminToken(admin.id, admin.username, admin.password);

    // Return admin record without the password field
    const { password: _, ...safeAdmin } = admin;
    const response = NextResponse.json({ user: { ...safeAdmin, role: 'admin' } });

    // Set secure HttpOnly cookie
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error: any) {
    console.error('[Admin Login] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}
