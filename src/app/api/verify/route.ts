import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/verify?id=<bookingId>
 *
 * Public endpoint — no authentication required.
 * Uses select('*') to avoid column-not-found errors when optional columns
 * (booker_phone, attendee_details, etc.) may not exist in older schema versions.
 * Never exposes: passwords, user_id, or internal DB internals in the response.
 */
export async function GET(request: Request) {
  let sanitised = '';

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId || !bookingId.trim()) {
      return NextResponse.json(
        { valid: false, reason: 'not_found', error: 'No booking ID provided.' },
        { status: 400 }
      );
    }

    // Accept any alphanumeric + hyphen + underscore booking ID (case-insensitive)
    sanitised = bookingId.trim().toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
    if (!sanitised || sanitised.length < 3) {
      return NextResponse.json(
        { valid: false, reason: 'not_found', error: 'Invalid booking ID format.' },
        { status: 400 }
      );
    }

    // Use select('*') — avoids "column not found" errors for optional columns
    const { data: bk, error: dbError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', sanitised)
      .maybeSingle();

    // Actual database / network error
    if (dbError) {
      console.error('[verify] Supabase DB error for id=%s:', sanitised, dbError);
      return NextResponse.json(
        {
          valid: false,
          reason: 'server_error',
          error: 'A server error occurred while verifying your ticket. Please try again.',
          // debug field — only logged server-side, not shown to user in UI
          _debug: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
        },
        { status: 500 }
      );
    }

    // Booking genuinely does not exist
    if (!bk) {
      console.log('[verify] Booking not found for id=%s', sanitised);
      return NextResponse.json(
        { valid: false, reason: 'not_found', error: 'Booking not found. This QR code may be invalid or expired.' },
        { status: 404 }
      );
    }

    // ── Attendee resolution (handles all three storage patterns) ────────────
    let rawAttendees: Record<string, any> = {};
    const rawScreenshot: string = bk.screenshot || '';

    // Pattern 1: dedicated attendee_details column (modern)
    if (bk.attendee_details && typeof bk.attendee_details === 'object' && Object.keys(bk.attendee_details).length > 0) {
      rawAttendees = bk.attendee_details;
    }
    // Pattern 2: attendee JSON packed into screenshot column (legacy pipe-delimited)
    else if (rawScreenshot.includes('|')) {
      try {
        const parts = rawScreenshot.split('|');
        rawAttendees = JSON.parse(parts[1] || '{}');
      } catch {
        rawAttendees = {};
      }
    }

    // Strip internal __ meta keys; resolve name/phone per seat
    const cleanAttendees: Record<string, { name: string; phone: string }> = {};
    for (const [seat, val] of Object.entries(rawAttendees)) {
      if (seat.startsWith('__')) continue;
      if (typeof val === 'object' && val !== null) {
        cleanAttendees[seat] = { name: val.name || '', phone: val.phone || val.whatsapp || '' };
      } else if (typeof val === 'string') {
        cleanAttendees[seat] = { name: val, phone: '' };
      }
    }

    // ── Resolve booker phone (may live in attendees.__booker_phone) ─────────
    const bookerPhone: string =
      bk.booker_phone ||
      rawAttendees.__booker_phone ||
      '';

    // ── Resolve primary attendee name from booker_name or first attendee ───
    const primaryAttendeeName: string =
      bk.booker_name ||
      (Object.values(cleanAttendees)[0]?.name) ||
      '—';

    // ── Status mapping ──────────────────────────────────────────────────────
    const statusMap: Record<string, string> = {
      approved: 'Confirmed',
      pending:  'Pending Approval',
      denied:   'Rejected',
    };
    const status: string = bk.status || 'pending';
    const statusLabel: string = statusMap[status] ?? 'Unknown';

    // A booking is considered "valid" if it exists AND is not denied
    // (pending is valid — just awaiting admin approval)
    const isValid = status === 'approved' || status === 'pending';

    const paymentStatusMap: Record<string, string> = {
      approved: 'Verified & Cleared',
      pending:  'Pending Review',
      denied:   'Rejected',
    };

    // ── Build safe public ticket object ────────────────────────────────────
    const ticket = {
      bookingId:       bk.id,
      eventName:       bk.seminar_name || bk.bus_name || '—',
      venue:           bk.source || '—',
      session:         bk.destination || '—',
      date:            bk.date || '—',
      time:            bk.time || '—',
      seats:           Array.isArray(bk.seats) ? bk.seats : [],
      amountPaid:      bk.total_price != null ? `₹${bk.total_price}` : '—',
      attendeeName:    primaryAttendeeName,
      bookerPhone:     bookerPhone || '—',
      status,
      statusLabel,
      attendees:       cleanAttendees,
      bookedOn:        bk.created_at
        ? new Date(bk.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
      paymentStatus:   paymentStatusMap[status] ?? 'Unknown',
    };

    console.log('[verify] Returning ticket for id=%s status=%s valid=%s', sanitised, status, isValid);
    return NextResponse.json({ valid: isValid, ticket }, { status: 200 });

  } catch (err: any) {
    console.error('[verify] Unexpected exception for id=%s:', sanitised, err);
    return NextResponse.json(
      {
        valid: false,
        reason: 'server_error',
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}
