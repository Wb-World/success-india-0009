import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

import { verifyAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'eventId parameter is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('value')
      .eq('key', `blocked_seats_${eventId}`)
      .maybeSingle();

    if (error) {
      console.error('[Blocked Seats GET] database error:', error);
      return NextResponse.json({ error: 'Failed to retrieve blocked seats' }, { status: 500 });
    }

    let blockedSeats: string[] = [];
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value);
        if (Array.isArray(parsed)) {
          blockedSeats = parsed;
        }
      } catch (e) {
        console.error('[Blocked Seats GET] parse error:', e);
      }
    }

    return NextResponse.json({ blockedSeats });
  } catch (err: any) {
    console.error('[Blocked Seats GET] error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const { eventId, blockedSeats } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    if (!Array.isArray(blockedSeats)) {
      return NextResponse.json({ error: 'blockedSeats must be an array of strings' }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from('configs')
      .upsert({
        key: `blocked_seats_${eventId}`,
        value: JSON.stringify(blockedSeats)
      });

    if (upsertError) {
      console.error('[Blocked Seats POST] upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save blocked seats' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Blocked seats saved successfully' });
  } catch (err: any) {
    console.error('[Blocked Seats POST] error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
