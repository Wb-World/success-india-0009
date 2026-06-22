import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, hashPassword } from '@/lib/auth';

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

    // Return admin record without the password field
    const { password: _, ...safeAdmin } = admin;
    return NextResponse.json({ user: { ...safeAdmin, role: 'admin' } });
  } catch (error: any) {
    console.error('[Admin Login] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}
