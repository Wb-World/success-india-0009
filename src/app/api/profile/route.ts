import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, name, email, phone, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's bookings sorted newest first
    const { data: rawBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingError) {
      console.error('Profile bookings fetch error:', bookingError);
    }

    // Map snake_case → camelCase for frontend
    const bookings = (rawBookings || []).map((bk) => {
      let cleanScreenshot = bk.screenshot || '';
      let attendees = bk.attendee_details || {};
      let qrCodePayload = bk.qr_code_payload || '';

      if ((!attendees || Object.keys(attendees).length === 0) && cleanScreenshot.includes('|')) {
        const parts = cleanScreenshot.split('|');
        cleanScreenshot = parts[0];
        try {
          attendees = JSON.parse(parts[1] || '{}');
          if (parts[2]) {
            qrCodePayload = parts[2];
          }
        } catch (e) {
          console.error('Failed to parse fallback attendees JSON:', e);
        }
      }

      return {
        id: bk.id,
        userId: bk.user_id,
        seminarId: bk.seminar_id,
        eventId: bk.seminar_id || bk.bus_id,
        eventName: bk.seminar_name || bk.bus_name,
        seminarName: bk.seminar_name || bk.bus_name,
        venue: bk.source,
        seminar: bk.destination,
        date: bk.date,
        time: bk.time,
        seats: bk.seats,
        totalPrice: bk.total_price,
        screenshot: cleanScreenshot,
        attendees: attendees,
        qrCodePayload: qrCodePayload,
        status: bk.status,
        createdAt: bk.created_at,
      };
    });

    return NextResponse.json({ user, bookings });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone } = await request.json();
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    // Check if email is taken by another user
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Email is already in use by another account' },
        { status: 400 }
      );
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ name, email, phone })
      .eq('id', userId)
      .select('id, username, name, email, phone, role')
      .single();

    if (updateError || !updatedUser) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating profile' },
      { status: 500 }
    );
  }
}
