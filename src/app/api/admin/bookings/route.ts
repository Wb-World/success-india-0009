import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requester is an admin in Supabase
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    // Fetch all bookings, joining the user info using foreign key relationship
    const { data: rawBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*, users (name, email, phone)');

    if (bookingsError) {
      console.error('Database query error fetching admin bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to retrieve bookings from database' },
        { status: 500 }
      );
    }

    // Map bookings snake_case -> camelCase and format the user object
    const mappedBookings = (rawBookings || []).map((b: any) => {
      // Handle the joined users record
      const joinedUser = Array.isArray(b.users) ? b.users[0] : b.users;
      const userObj = joinedUser
        ? {
            name: joinedUser.name,
            email: joinedUser.email,
            phone: joinedUser.phone,
          }
        : {
            name: 'Unknown User',
            email: 'N/A',
            phone: 'N/A',
          };

      let cleanScreenshot = b.screenshot || '';
      let attendees = b.attendee_details || {};
      let qrCodePayload = b.qr_code_payload || '';

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
        id: b.id,
        userId: b.user_id,
        seminarId: b.seminar_id,
        eventId: b.seminar_id || b.bus_id,
        eventName: b.seminar_name || b.bus_name,
        seminarName: b.seminar_name || b.bus_name,
        venue: b.source,
        seminar: b.destination,
        date: b.date,
        time: b.time,
        seats: b.seats || [],
        totalPrice: b.total_price,
        screenshot: cleanScreenshot,
        attendees: attendees,
        qrCodePayload: qrCodePayload,
        status: b.status,
        createdAt: b.created_at,
        user: userObj,
      };
    });

    // Sort bookings: pending first, then newest first
    const sortedBookings = mappedBookings.sort((a: any, b: any) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ bookings: sortedBookings });
  } catch (error) {
    console.error('Admin bookings GET error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching admin bookings' },
      { status: 500 }
    );
  }
}

