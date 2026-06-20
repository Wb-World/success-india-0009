import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username/phone and password are required' },
        { status: 400 }
      );
    }

    let user = null;
    let error = null;

    const usernameQuery = await supabaseAdmin
      .from('users')
      .select('id, username, name, phone, role, password')
      .ilike('username', username)
      .maybeSingle();

    if (usernameQuery.error) {
      error = usernameQuery.error;
    } else if (usernameQuery.data) {
      user = usernameQuery.data;
    } else {
      const phoneQuery = await supabaseAdmin
        .from('users')
        .select('id, username, name, phone, role, password')
        .eq('phone', username)
        .maybeSingle();
      
      if (phoneQuery.error) {
        error = phoneQuery.error;
      } else {
        user = phoneQuery.data;
      }
    }

    // If default admin is requested but not found in the database, seed it on-the-fly
    if ((!user || error) && username.toLowerCase() === 'admin' && password === 'admin123') {
      console.log('[Auth Login] Default admin not found in Supabase. Programmatically seeding default admin...');
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: 'adm_1',
          username: 'admin',
          password: hashPassword('admin123'),
          name: 'Super Admin',
          phone: '+91 9999988888',
          role: 'admin',
        })
        .select('id, username, name, phone, role, password')
        .single();

      if (!insertError && newAdmin) {
        user = newAdmin;
        error = null;
      } else {
        console.error('[Auth Login] Failed to seed default admin:', insertError);
      }
    }

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid username/phone or password' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid username/phone or password' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}
