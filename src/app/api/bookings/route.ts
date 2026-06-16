import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateBookingId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EVT-${year}-${random}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      bookingId: clientBookingId,
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
    } = body;

    // Resolve field aliases (backward compatible with legacy shape)
    const resolvedSeminarId = seminarId || eventId || busId;
    const resolvedSeminarName = seminarName || eventName || busName;
    const resolvedVenue = venue || source;
    const resolvedSeminarTopic = seminar || destination;

    // Generate or use provided booking reference ID
    const bookingRefId = clientBookingId || generateBookingId();

    // Core field validation (no user auth required)
    if (
      !resolvedSeminarId ||
      !resolvedSeminarName ||
      !resolvedVenue ||
      !resolvedSeminarTopic ||
      !date ||
      !time ||
      !seats ||
      !Array.isArray(seats) ||
      seats.length === 0 ||
      totalPrice === undefined ||
      totalPrice === null
    ) {
      return NextResponse.json(
        { error: 'Booking fields, seats, and total price are required' },
        { status: 400 }
      );
    }

    if (seats.length < 1 || seats.length > 10) {
      return NextResponse.json(
        { error: 'You can only book between 1 and 10 seats.' },
        { status: 400 }
      );
    }

    // Check for seat conflicts on approved bookings (best effort)
    try {
      const { data: conflicting } = await supabaseAdmin
        .from('bookings')
        .select('seats')
        .or(`seminar_id.eq.${resolvedSeminarId},bus_id.eq.${resolvedSeminarId}`)
        .eq('date', date)
        .eq('time', time)
        .eq('status', 'approved');

      const alreadyBooked = (conflicting || []).flatMap((bk: any) => bk.seats || []);
      const hasConflict = seats.some((s: string) => alreadyBooked.includes(s));

      if (hasConflict) {
        return NextResponse.json(
          { error: 'One or more selected seats have already been booked. Please refresh and select different seats.' },
          { status: 400 }
        );
      }
    } catch (_) {
      // Non-blocking: continue even if conflict check fails
    }

    // Attempt to save booking to database (user_id required — default to 'usr_1' for guests)
    let savedBooking: any = null;
    let userId = request.headers.get('x-user-id') || null;
    if (!userId) {
      userId = 'usr_1'; // Guest fallback user to bypass database NOT NULL constraint
    }

    try {
      const { data: newBooking, error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert({
          id: bookingRefId,
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
          screenshot: screenshot || 'DIRECT_BOOKING',
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (!insertError) {
        savedBooking = newBooking;
      } else {
        console.error("BOOKING_INSERTION_FAILED (primary):", insertError);
        console.warn('Primary booking insert failed, attempting legacy insert:', insertError.message);

        await supabaseAdmin.from('buses').upsert(
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

        const legacyResult = await supabaseAdmin
          .from('bookings')
          .insert({
            id: bookingRefId,
            user_id: userId,
            bus_id: resolvedSeminarId,
            bus_name: resolvedSeminarName,
            source: resolvedVenue,
            destination: resolvedSeminarTopic,
            date,
            time,
            seats,
            total_price: totalPrice,
            screenshot: screenshot || 'DIRECT_BOOKING',
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select('*')
          .single();

        if (!legacyResult.error) {
          savedBooking = legacyResult.data;
        } else {
          console.error("BOOKING_INSERTION_FAILED (legacy):", legacyResult.error);
          throw new Error(`Database insertions failed. Primary error: ${insertError.message}. Legacy error: ${legacyResult.error.message}`);
        }
      }

      if (savedBooking) {
        try {
          await supabaseAdmin
            .from('payment_proofs')
            .insert({
              booking_id: bookingRefId,
              screenshot_path: screenshot || 'DIRECT_BOOKING',
              verification_status: 'pending'
            });
        } catch (proofErr) {
          console.warn('Non-fatal: Failed to save to payment_proofs table:', proofErr);
        }
      } else {
        throw new Error('Database write operation could not be completed.');
      }
    } catch (dbErr: any) {
      console.error("BOOKING_INSERTION_FAILED:", dbErr);
      return NextResponse.json(
        { error: dbErr.message || 'Database write operation failed' },
        { status: 500 }
      );
    }

    // Return booking confirmation only when DB save succeeds
    const booking = {
      id: bookingRefId,
      bookingId: bookingRefId,
      seminarId: resolvedSeminarId,
      seminarName: resolvedSeminarName,
      venue: resolvedVenue,
      seminar: resolvedSeminarTopic,
      date,
      time,
      seats,
      totalPrice,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      dbId: savedBooking.id,
      dbStatus: savedBooking.status,
    };

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred submitting the booking' },
      { status: 500 }
    );
  }
}
