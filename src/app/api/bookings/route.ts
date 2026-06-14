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
      busId,
      busName,
      seminarId,
      seminarName,
      source,
      destination,
      date,
      time,
      seats,
      totalPrice,
      screenshot,
    } = await request.json();

    const resolvedSeminarId = seminarId || busId;
    const resolvedSeminarName = seminarName || busName;

    // Validation
    if (
      !resolvedSeminarId || !resolvedSeminarName || !source || !destination || !date || !time ||
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

    // Create booking
    const newId = `bk_${Date.now()}`;
    const { data: newBooking, error: insertError } = await supabaseAdmin
      .from('bookings')
      .insert({
        id: newId,
        user_id: userId,
        seminar_id: resolvedSeminarId,
        seminar_name: resolvedSeminarName,
        bus_id: null,
        bus_name: null,
        source,
        destination,
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
      busId: newBooking.seminar_id || newBooking.bus_id,
      busName: newBooking.seminar_name || newBooking.bus_name,
      source: newBooking.source,
      destination: newBooking.destination,
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
