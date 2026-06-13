import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, password, name, email, phone } = await request.json();

    if (!username || !password || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Create new user
    const newId = `usr_${Date.now()}`;
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: newId,
        username,
        password,
        name,
        email,
        phone,
        role: 'user',
      })
      .select('id, username, name, email, phone, role')
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
