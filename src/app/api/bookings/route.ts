import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateQrSignature } from '@/lib/auth';

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


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId parameter is required' }, { status: 400 });
    }

    // ── Primary: query using OR to match both seminar_id and bus_id ──────────
    // New bookings: seminar_id = eventId, bus_id = null
    // Legacy bookings: bus_id = eventId, seminar_id = null/missing
    let takenSeats: string[] = [];
    let querySucceeded = false;

    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('seats')
        .or(`seminar_id.eq.${eventId},bus_id.eq.${eventId}`)
        .in('status', ['approved', 'pending']);

      if (!error) {
        takenSeats = (data || []).flatMap((bk: any) => bk.seats || []);
        querySucceeded = true;
      } else {
        // seminar_id column may not exist — fall back to bus_id only
        console.warn('[bookings GET] OR query failed, falling back to bus_id only:', error.message);
      }
    } catch (e) {
      console.warn('[bookings GET] OR query threw, falling back:', e);
    }

    // ── Fallback: bus_id only (older schema) ─────────────────────────────────
    if (!querySucceeded) {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('seats')
        .eq('bus_id', eventId)
        .in('status', ['approved', 'pending']);

      if (error) {
        console.error('[bookings GET] fallback query failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      takenSeats = (data || []).flatMap((bk: any) => bk.seats || []);
    }

    const uniqueSeats = Array.from(new Set(takenSeats));
    return NextResponse.json({ seats: uniqueSeats });
  } catch (err: any) {
    console.error('Error in GET /api/bookings:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
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
      attendeeDetails,
      bookerName,
      bookerMemberId,
      bookerPhone,
      bookerVpName,
      userId,
      userEmail,
      username,
    } = body;

    // Resolve field aliases (backward compatible with legacy shape)
    const resolvedSeminarId = seminarId || eventId || busId;
    const resolvedSeminarName = seminarName || eventName || busName;
    const resolvedVenue = venue || source;
    const resolvedSeminarTopic = seminar || destination;

    const resolvedUserId = userId || body.user_id || request.headers.get('x-user-id') || null;
    const resolvedUserEmail = userEmail || body.user_email || null;
    const resolvedUsername = username || null;

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

    // Check for seat conflicts on approved/pending bookings (best effort)
    try {
      const orFilter = `seminar_id.eq.${resolvedSeminarId},bus_id.eq.${resolvedSeminarId}`;
      let conflictQuery = supabaseAdmin
        .from('bookings')
        .select('seats')
        .or(orFilter)
        .eq('date', date)
        .eq('time', time)
        .in('status', ['approved', 'pending']);

      let { data: conflicting, error: conflictError } = await conflictQuery;

      // Fallback to bus_id only if OR fails (older schema)
      if (conflictError) {
        const fb = await supabaseAdmin
          .from('bookings')
          .select('seats')
          .eq('bus_id', resolvedSeminarId)
          .eq('date', date)
          .eq('time', time)
          .in('status', ['approved', 'pending']);
        conflicting = fb.data;
      }

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

    let savedBooking: any = null;
    // No auth required — booker identity comes from the request body
    const resolvedBookerName = (bookerName || 'Guest').trim();
    const resolvedBookerMemberId = (bookerMemberId || 'GUEST0').trim().toUpperCase();
    const resolvedBookerPhone = (bookerPhone || '').trim();
    const resolvedBookerVpName = (bookerVpName || '').trim();

    // Sanitize screenshot URL (strip any pipe-delimited legacy suffix)
    const cleanScreenshot = (screenshot || 'DIRECT_BOOKING').split('|')[0];

    // Build QR payload for ticket validation in structured format with signature
    const seatStr = seats.join(',');
    const amountStr = String(totalPrice).replace("INR", "").replace("₹", "").trim();
    // Resolve primary attendee name
    const primaryName = (Object.values(attendeeDetails || {}) as any[])[0]?.name || bookerName || '—';
    const signature = generateQrSignature(bookingRefId, 'PENDING', seatStr, amountStr);
    
    const qrCodePayload = [
      `BOOKING_ID:${bookingRefId}`,
      `STATUS:PENDING`,
      `EVENT_NAME:${resolvedSeminarName}`,
      `DATE:${date}`,
      `TIME:${time || '10:00 AM'}`,
      `VENUE:${resolvedVenue}`,
      `SEAT:${seatStr}`,
      `ATTENDEE:${primaryName}`,
      `PHONE:${resolvedBookerPhone || '—'}`,
      `AMOUNT:${amountStr}`,
      `SIGNATURE:${signature}`
    ].join('|');

    try {
      let { data: newBooking, error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert({
          id: bookingRefId,
          user_id: resolvedUserId,
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
          screenshot: cleanScreenshot,
          status: 'pending',
          created_at: new Date().toISOString(),
          attendee_details: attendeeDetails || {},
          qr_code_payload: qrCodePayload,
          booker_name: resolvedBookerName,
          booker_member_id: resolvedBookerMemberId,
          booker_phone: resolvedBookerPhone,
          booker_vp_name: resolvedBookerVpName,
          user_email: resolvedUserEmail,
          username: resolvedUsername,
        })
        .select('*')
        .single();

      // If insert failed due to column missing or general schema issue, retry without custom columns
      if (insertError && (
        insertError.message.includes('user_email') ||
        insertError.message.includes('username') ||
        insertError.message.includes('booker_phone') ||
        insertError.code === 'PGRST204' ||
        insertError.message.includes('column')
      )) {
        console.warn('Primary insert failed with column error, retrying with fallback fields');
        const retryResult = await supabaseAdmin
          .from('bookings')
          .insert({
            id: bookingRefId,
            user_id: resolvedUserId,
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
            screenshot: cleanScreenshot,
            status: 'pending',
            created_at: new Date().toISOString(),
            attendee_details: {
              ...(attendeeDetails || {}),
              __booker_phone: resolvedBookerPhone,
              __user_email: resolvedUserEmail,
              __username: resolvedUsername,
              __booker_vp_name: resolvedBookerVpName,
            },
            qr_code_payload: qrCodePayload,
            booker_name: resolvedBookerName,
            booker_member_id: resolvedBookerMemberId,
            booker_vp_name: resolvedBookerVpName,
          })
          .select('*')
          .single();

        newBooking = retryResult.data;
        insertError = retryResult.error;
      }

      if (!insertError) {
        savedBooking = newBooking;
      } else {
        console.error("BOOKING_INSERTION_FAILED (primary):", insertError);
        console.warn('Primary insert failed, attempting legacy insert with serialization fallback');

        const serializedScreenshot = `${cleanScreenshot}|${JSON.stringify({
          ...(attendeeDetails || {}),
          __booker_phone: resolvedBookerPhone,
          __user_email: resolvedUserEmail,
          __username: resolvedUsername,
          __booker_vp_name: resolvedBookerVpName,
        })}|${qrCodePayload}`;

        await supabaseAdmin.from('buses').upsert(
          {
            id: resolvedSeminarId,
            name: resolvedSeminarName,
            type: resolvedSeminarTopic,
            source: resolvedVenue,
            destination: resolvedSeminarTopic,
            price: Number(totalPrice) || 0,
            duration: 'Event session',
            times: [time],
          },
          { onConflict: 'id' }
        );

        const legacyResult = await supabaseAdmin
          .from('bookings')
          .insert({
            id: bookingRefId,
            user_id: resolvedUserId,
            bus_id: resolvedSeminarId,
            bus_name: resolvedSeminarName,
            source: resolvedVenue,
            destination: resolvedSeminarTopic,
            date,
            time,
            seats,
            total_price: totalPrice,
            screenshot: serializedScreenshot,
            status: 'pending',
            created_at: new Date().toISOString(),
            booker_name: resolvedBookerName,
            booker_member_id: resolvedBookerMemberId,
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
              screenshot_path: cleanScreenshot,
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
      dbId: savedBooking?.id || bookingRefId,
      dbStatus: savedBooking?.status || 'pending',
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
