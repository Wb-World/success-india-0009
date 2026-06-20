import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/verify?id=<bookingId>
 *
 * Public endpoint — no authentication required.
 * Returns only safe, non-sensitive booking fields for ticket verification.
 * Never exposes: passwords, user_id, internal IDs, raw screenshot paths,
 * payment proof details, or any admin-only data.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json(
        { valid: false, error: 'No booking ID provided.' },
        { status: 400 }
      );
    }

    // Sanitise input — booking IDs are alphanumeric with hyphens only
    const sanitised = bookingId.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    if (!sanitised || sanitised.length < 4) {
      return NextResponse.json(
        { valid: false, error: 'Invalid booking ID format.' },
        { status: 400 }
      );
    }

    const { data: bk, error } = await supabaseAdmin
      .from('bookings')
      .select(
        'id, seminar_name, bus_name, source, destination, date, time, seats, total_price, status, created_at, attendee_details, booker_name, booker_phone, screenshot'
      )
      .eq('id', sanitised)
      .maybeSingle();

    if (error) {
      console.error('Verify API DB error:', error);
      return NextResponse.json(
        { valid: false, error: 'Verification service temporarily unavailable.' },
        { status: 500 }
      );
    }

    // Booking not found
    if (!bk) {
      return NextResponse.json({ valid: false, error: 'Booking not found.' }, { status: 404 });
    }

    // Resolve attendee details (handles both direct column and legacy serialised format)
    let attendees: Record<string, any> = bk.attendee_details || {};
    const rawScreenshot: string = bk.screenshot || '';
    if ((!attendees || Object.keys(attendees).length === 0) && rawScreenshot.includes('|')) {
      try {
        const parts = rawScreenshot.split('|');
        attendees = JSON.parse(parts[1] || '{}');
      } catch {
        attendees = {};
      }
    }
    // Strip internal meta-keys (keys starting with __)
    const cleanAttendees: Record<string, any> = {};
    for (const [k, v] of Object.entries(attendees)) {
      if (!k.startsWith('__')) cleanAttendees[k] = v;
    }

    // Map status to human-readable label
    const statusMap: Record<string, string> = {
      approved: 'Confirmed',
      pending: 'Pending Verification',
      denied: 'Rejected',
    };
    const statusLabel = statusMap[bk.status] ?? 'Unknown';
    const isValid = bk.status === 'approved';

    // Build safe public payload — NO user_id, password, internal DB columns, raw screenshot
    const ticket = {
      bookingId:     bk.id,
      eventName:     bk.seminar_name || bk.bus_name || '—',
      venue:         bk.source || '—',
      session:       bk.destination || '—',
      date:          bk.date || '—',
      time:          bk.time || '—',
      seats:         bk.seats || [],
      amountPaid:    bk.total_price != null ? `₹${bk.total_price}` : '—',
      bookerName:    bk.booker_name || '—',
      bookerPhone:   bk.booker_phone || '—',
      status:        bk.status,
      statusLabel,
      attendees:     cleanAttendees,
      bookedOn:      bk.created_at
        ? new Date(bk.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      paymentStatus: bk.status === 'approved' ? 'Verified & Cleared' : bk.status === 'denied' ? 'Rejected' : 'Pending Review',
    };

    return NextResponse.json({ valid: isValid, ticket }, { status: 200 });
  } catch (err: any) {
    console.error('Verify API unexpected error:', err);
    return NextResponse.json(
      { valid: false, error: 'Verification service error.' },
      { status: 500 }
    );
  }
}
