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
      bookerName,
      bookerMemberId,
      bookerPhone,
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

    let savedBooking: any = null;
    // No auth required — booker identity comes from the request body
    const resolvedBookerName = (bookerName || 'Guest').trim();
    const resolvedBookerMemberId = (bookerMemberId || 'GUEST0').trim().toUpperCase();
    const resolvedBookerPhone = (bookerPhone || '').trim();

    // Sanitize screenshot URL (strip any pipe-delimited legacy suffix)
    const cleanScreenshot = (screenshot || 'DIRECT_BOOKING').split('|')[0];

    // Build QR payload for ticket validation
    const qrCodePayload = `BOOKING:${bookingRefId}|EVENT:${resolvedSeminarName}|SEATS:${seats.join(',')}|VENUE:${resolvedVenue}|DATE:${date}|AMOUNT:INR${totalPrice}|STATUS:PENDING_VERIFICATION`;

    try {
      let { data: newBooking, error: insertError } = await supabaseAdmin
        .from('bookings')
        .insert({
          id: bookingRefId,
          user_id: null,
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
        })
        .select('*')
        .single();

      // If insert failed due to column missing or general schema issue, retry without booker_phone
      if (insertError && (insertError.message.includes('booker_phone') || insertError.code === 'PGRST204' || insertError.message.includes('column'))) {
        console.warn('Primary insert failed with column error, retrying without booker_phone column');
        const retryResult = await supabaseAdmin
          .from('bookings')
          .insert({
            id: bookingRefId,
            user_id: null,
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
            },
            qr_code_payload: qrCodePayload,
            booker_name: resolvedBookerName,
            booker_member_id: resolvedBookerMemberId,
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
            user_id: null,
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
