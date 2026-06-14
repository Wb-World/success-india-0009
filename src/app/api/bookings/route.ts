import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      seminarId,
      seminarName,
      eventId,
      eventName,
      busId,
      busName,
      venue,
      seminar,
      source,
      destination,
      date,
      time,
      seats,
      totalPrice,
      screenshot,
    } = await request.json();

    const resolvedSeminarId = seminarId || eventId || busId;
    const resolvedSeminarName = seminarName || eventName || busName;
    const resolvedVenue = venue || source;
    const resolvedSeminarTopic = seminar || destination;

    // Validation
    if (
      !resolvedSeminarId || !resolvedSeminarName || !resolvedVenue || !resolvedSeminarTopic || !date || !time ||
      !seats || !Array.isArray(seats) || seats.length === 0 ||
      totalPrice === undefined || totalPrice === null || !screenshot
    ) {
      return NextResponse.json(
        { error: 'All booking fields, seats, and payment screenshot are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for double-booked seats (approved bookings only)
    const { data: conflicting, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('seats')
      .or(`seminar_id.eq.${resolvedSeminarId},bus_id.eq.${resolvedSeminarId}`)
      .eq('date', date)
      .eq('time', time)
      .eq('status', 'approved');

    if (conflictError) {
      console.error('Conflict check error:', conflictError);
    }

    const alreadyBooked = (conflicting || []).flatMap((bk) => bk.seats || []);
    const hasConflict = seats.some((s: string) => alreadyBooked.includes(s));

    if (hasConflict) {
      return NextResponse.json(
        { error: 'One or more selected seats have already been booked' },
        { status: 400 }
      );
    }

    // Create booking. Prefer the new seminar columns, then fall back to the
    // legacy seminar compatibility shape if the deployed database has not been migrated.
    const newId = `bk_${Date.now()}`;
    let { data: newBooking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert({
        id: newId,
        user_id: userId,
        seminar_id: resolvedSeminarId,
        seminar_name: resolvedSeminarName,
        bus_id: null,
        bus_name: null,
        source: resolvedVenue,
        destination: resolvedSeminarTopic,
        date,
        time,
        seats,
        total_price: totalPrice,
        screenshot,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (insertError || !newBooking) {
      console.error('Modern seminar booking insert failed, retrying legacy-compatible insert:', insertError);

      const { error: legacyEventError } = await supabaseAdmin
        .from('buses')
        .upsert(
          {
            id: resolvedSeminarId,
            name: resolvedSeminarName,
            type: resolvedSeminarTopic,
            source: resolvedVenue,
            destination: resolvedSeminarTopic,
            price: Number(totalPrice) || 0,
            duration: 'Seminar session',
            times: [time],
          },
          { onConflict: 'id' }
        );

      if (legacyEventError) {
        console.error('Legacy seminar compatibility upsert error:', legacyEventError);
      }

      const legacyInsert = await supabaseAdmin
        .from('bookings')
        .insert({
          id: newId,
          user_id: userId,
          bus_id: resolvedSeminarId,
          bus_name: resolvedSeminarName,
          source: resolvedVenue,
          destination: resolvedSeminarTopic,
          date,
          time,
          seats,
          total_price: totalPrice,
          screenshot,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      newBooking = legacyInsert.data;
      insertError = legacyInsert.error;
    }

    if (insertError || !newBooking) {
      console.error('Booking insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Map snake_case → camelCase for the frontend
    const booking = {
      id: newBooking.id,
      userId: newBooking.user_id,
      seminarId: newBooking.seminar_id,
      seminarName: newBooking.seminar_name,
      venue: newBooking.source,
      seminar: newBooking.destination,
      date: newBooking.date,
      time: newBooking.time,
      seats: newBooking.seats,
      totalPrice: newBooking.total_price,
      screenshot: newBooking.screenshot,
      status: newBooking.status,
      createdAt: newBooking.created_at,
    };

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred submitting booking' },
      { status: 500 }
    );
  }
}
