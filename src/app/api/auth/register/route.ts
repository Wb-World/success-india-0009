import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password, name, phone } = await request.json();

    if (!username || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUsername } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    // Create new user
    const newId = `usr_${Date.now()}`;
    const hashedPassword = hashPassword(password);
    
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: newId,
        username,
        password: hashedPassword,
        name,
        phone,
        role: 'user',
      })
      .select('id, username, name, phone, role')
      .single();

    if (error || !newUser) {
      console.error('Register insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
