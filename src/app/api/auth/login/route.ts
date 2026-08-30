import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const loginId = (body.memberId || body.username || '').trim();
    const password = body.password || '';

    if (!loginId || !password) {
      return NextResponse.json(
        { error: 'Member ID / Phone number and password are required' },
        { status: 400 }
      );
    }

    let user = null;
    let error = null;

    // Search by member_id
    const userQuery = await supabaseAdmin
      .from('users')
      .select('id, member_id, name, phone, role, password, email')
      .ilike('member_id', loginId)
      .maybeSingle();

    if (userQuery.error) {
      error = userQuery.error;
    } else if (userQuery.data) {
      user = userQuery.data;
    } else {
      // Search by phone number
      const phoneQuery = await supabaseAdmin
        .from('users')
        .select('id, member_id, name, phone, role, password, email')
        .eq('phone', loginId)
        .maybeSingle();
      
      if (phoneQuery.error) {
        error = phoneQuery.error;
      } else {
        user = phoneQuery.data;
      }
    }

    // If default admin is requested but not found in DB, seed on-the-fly
    if ((!user || error) && loginId.toLowerCase() === 'admin' && password === 'admin123') {
      console.log('[Auth Login] Default admin not found in Supabase. Programmatically seeding default admin...');
      const { data: newAdmin, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: 'adm_1',
          member_id: 'admin',
          password: hashPassword('admin123'),
          name: 'Super Admin',
          phone: '+91 9999988888',
          role: 'admin',
        })
        .select('id, member_id, name, phone, role, password, email')
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
        { error: 'Invalid Member ID/Phone or Password' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'Invalid Member ID/Phone or Password' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
