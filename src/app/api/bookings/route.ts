import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendMetaWhatsAppTicket } from '@/lib/whatsapp';

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

    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('seats')
      .eq('bus_id', eventId)
      .in('status', ['approved', 'pending']);

    if (error) {
      console.error('Failed to fetch booked seats:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const takenSeats = (bookings || []).flatMap((bk: any) => bk.seats || []);
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
        .eq('bus_id', resolvedSeminarId)
        .eq('date', date)
        .eq('time', time)
        .in('status', ['approved', 'pending']);

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

    // Clean screenshot path if it has legacy serialization
    let cleanScreenshot = screenshot || 'DIRECT_BOOKING';
    if (cleanScreenshot.includes('|')) {
      cleanScreenshot = cleanScreenshot.split('|')[0];
    }

    // Construct the QR Code payload for validation:
    // Format: BOOKING:<id>|EVENT:<event_name>|SEATS:<seats>|ATTENDEES:<seat>=<name>,...|VENUE:<venue>|DATE:<date>|AMOUNT:INR<total>|STATUS:PENDING_VERIFICATION
    const attendeeListString = seats.map((s: string) => {
      const detail = attendeeDetails?.[s];
      const name = detail ? detail.name : 'N/A';
      return `${s}=${name}`;
    }).join(',');

    const qrCodePayload = `BOOKING:${bookingRefId}|EVENT:${resolvedSeminarName}|SEATS:${seats.join(',')}|ATTENDEES:${attendeeListString}|VENUE:${resolvedVenue}|DATE:${date}|AMOUNT:INR${totalPrice}|STATUS:PENDING_VERIFICATION`;

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
          screenshot: cleanScreenshot,
          status: 'pending',
          created_at: new Date().toISOString(),
          attendee_details: attendeeDetails || {},
          qr_code_payload: qrCodePayload,
        })
        .select('*')
        .single();

      if (!insertError) {
        savedBooking = newBooking;
      } else {
        console.error("BOOKING_INSERTION_FAILED (primary):", insertError);
        console.warn('Primary insert failed, attempting legacy insert with serialization fallback');

        const serializedScreenshot = `${cleanScreenshot}|${JSON.stringify(attendeeDetails || {})}|${qrCodePayload}`;

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
            user_id: userId,
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

    // Dispatch Meta WhatsApp messages for each seat attendee in the background
    if (savedBooking) {
      const resolvedAttendeeDetails = attendeeDetails || {};

      Promise.all(
        seats.map(async (seat: string) => {
          const detail = resolvedAttendeeDetails[seat];
          if (detail && detail.name && detail.whatsapp) {
            // Generate attendee-specific QR validation URL
            // Format: BOOKING:<id>|EVENT:<event_name>|SEAT:<seat>|NAME:<name>|WHATSAPP:<whatsapp>
            const seatQrPayload = `BOOKING:${bookingRefId}|EVENT:${resolvedSeminarName}|SEAT:${seat}|NAME:${detail.name}|WHATSAPP:${detail.whatsapp}`;
            const seatQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(seatQrPayload)}&qzone=1&format=png&color=10b981`;

            try {
              await sendMetaWhatsAppTicket({
                attendeeName: detail.name,
                seatNumber: seat,
                eventDate: date,
                venue: resolvedVenue,
                whatsappNumber: detail.whatsapp,
                qrImageUrl: seatQrImageUrl,
              });
            } catch (waErr: any) {
              console.error(`[Meta WhatsApp Dispatch Fail] Seat ${seat}, Attendee ${detail.name}:`, waErr.message || waErr);
            }
          } else {
            console.warn(`[Meta WhatsApp Skip] Missing name or whatsapp details for seat: ${seat}`);
          }
        })
      ).catch(err => {
        console.error('Unhandled background Promise.all error in WhatsApp dispatcher:', err);
      });
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
