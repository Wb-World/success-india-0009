import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json().catch(() => ({}));

    if (id) {
      // Mark specific notification as read
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId);
    } else {
      // Mark all notifications as read for this user
      await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notifications PUT error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
