import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const memberId = (body.memberId || body.username || '').trim();
    const cleanEmail = (body.email || body.mailId || body.emailId || '').trim().toLowerCase();
    const cleanPhone = (body.phone || '').trim();
    const password = body.password || '';

    if (!memberId || !cleanEmail || !cleanPhone || !password) {
      return NextResponse.json(
        { error: 'All fields (Member ID, Email ID, Phone Number, Password) are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Check if Member ID already exists in member_id column
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('member_id', memberId)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Member ID already exists.' },
        { status: 400 }
      );
    }

    // Check if Email ID already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email ID is already registered.' },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingPhone) {
      return NextResponse.json(
        { error: 'Phone number is already registered.' },
        { status: 400 }
      );
    }

    // Create new user with member_id column
    const newId = `usr_${Date.now()}`;
    const hashedPassword = hashPassword(password);

    const insertPayload = {
      id: newId,
      member_id: memberId,
      email: cleanEmail,
      password: hashedPassword,
      name: memberId,
      phone: cleanPhone,
      role: 'user',
    };

    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert(insertPayload)
      .select('id, member_id, email, name, phone, role')
      .single();

    if (error || !newUser) {
      console.error('Register insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
