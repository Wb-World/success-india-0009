import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { username, email, newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password too short' }, { status: 400 });
    }

    const hashedPassword = hashPassword(newPassword);

    if (username && username.trim()) {
      await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .ilike('username', username.trim());
    } else if (email && email.trim()) {
      await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword })
        .ilike('username', email.trim());
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Password sync error:', err);
    return NextResponse.json({ success: true }); // Non-blocking
  }
}
