import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requester is an admin in the admin table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, username, role')
      .eq('id', adminId)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    // Fetch all bookings directly without joining users (due to lack of foreign key constraint)
    const { data: rawBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*');

    if (bookingsError) {
      console.error('Database query error fetching admin bookings:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to retrieve bookings from database' },
        { status: 500 }
      );
    }

    // Fetch matching user details for the bookings in a separate query to perform in-memory join
    const userIds = Array.from(new Set((rawBookings || []).map((b: any) => b.user_id).filter(Boolean)));
    const usersMap: Record<string, { name: string; phone: string }> = {};

    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, phone')
        .in('id', userIds);

      if (usersError) {
        console.error('Database query error fetching users for bookings:', usersError);
      } else if (usersData) {
        usersData.forEach((u: any) => {
          usersMap[u.id] = {
            name: u.name || '',
            phone: u.phone || '',
          };
        });
      }
    }

    // Map bookings snake_case -> camelCase and format the user object
    const mappedBookings = (rawBookings || []).map((b: any) => {
      // Handle the joined users record from the in-memory map
      const matchedUser = b.user_id ? usersMap[b.user_id] : null;
      const userObj = matchedUser
        ? {
            name: matchedUser.name,
            phone: matchedUser.phone,
          }
        : {
            name: 'Unknown User',
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

      const bookerPhone = b.booker_phone || attendees.__booker_phone || '';
      const bookerVpName = b.booker_vp_name || attendees.__booker_vp_name || '';
      const cleanAttendees = { ...attendees };
      delete cleanAttendees.__booker_phone;
      delete cleanAttendees.__user_email;
      delete cleanAttendees.__username;
      delete cleanAttendees.__booker_vp_name;

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
        attendees: cleanAttendees,
        qrCodePayload: qrCodePayload,
        status: b.status,
        createdAt: b.created_at,
        user: userObj,
        homepageVisible: b.homepage_visible !== false,
        bookerName: b.booker_name || '',
        bookerMemberId: b.booker_member_id || '',
        bookerPhone: bookerPhone,
        bookerVpName: bookerVpName,
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

