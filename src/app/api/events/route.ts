import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_TOTAL_SEATS = 300;
const DEFAULT_STATUS = 'Available to Register';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 42);
}

function getDatePart(value: string) {
  return value ? new Date(value).toISOString().split('T')[0] : '';
}

function getTimePart(value: string) {
  if (!value) return '10:00 AM';
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function normalizeComparable(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countSeats(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).length;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).length;
      }
    } catch {
      // Fall through to comma-separated parsing.
    }

    return trimmed.split(',').map((seat) => seat.trim()).filter(Boolean).length;
  }

  return 0;
}

function normalizeEvent(event: any, approvedBookedCount: number = 0) {
  const eventDateTime = event.event_datetime || event.eventDateTime || event.datetime;
  const eventDate = getDatePart(eventDateTime);
  const eventTime = getTimePart(eventDateTime);
  const totalSeats = Number(event.total_seats || event.totalSeats || DEFAULT_TOTAL_SEATS);

  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    venue: event.venue,
    eventDateTime,
    eventDate,
    eventTime,
    price: Number(event.price || 0),
    totalSeats,
    bookedCount: approvedBookedCount,
    availableSeats: Math.max(0, totalSeats - approvedBookedCount),
    status: event.status === 'inactive' ? 'Inactive' : DEFAULT_STATUS,

    // Compatibility shape consumed by existing seat selection components.
    name: event.title,
    type: 'success team Event Event',
    duration: 'Scheduled Program',
    times: [eventTime],
    bookedSeatsByTime: {},
  };
}

/**
 * Count approved seats for a specific event.
 * Fetches ALL approved bookings (no like/pattern filter) then matches in JS
 * across ALL possible event-linking fields.
 * Mirrors the admin route approach which uses select('*') reliably.
 */
async function countApprovedSeats(eventId: string, eventTitle: string): Promise<number> {
  try {
    // Same pattern as admin/bookings/route.ts - fetch all approved, filter in JS.
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('status', 'approved');

    if (error) {
      console.error('[countApprovedSeats] query failed:', error.message);
      return 0;
    }

    const rows = data || [];
    const idKey = normalizeComparable(eventId);
    const titleKey = normalizeComparable(eventTitle);

    // Match by ANY field that could link the booking to this event
    const matched = rows.filter((bk: any) => {
      const candidateValues = [
        bk.seminar_id,
        bk.bus_id,
        bk.event_id,
        bk.eventId,
        bk.seminar_name,
        bk.bus_name,
        bk.event_name,
        bk.eventName,
        bk.destination,
        bk.title,
        bk.name,
      ];

      return candidateValues.some((value) => {
        const key = normalizeComparable(value);
        return key && (key === idKey || key === titleKey);
      });
    });

    const totalSeatsBooked = matched.reduce(
      (sum: number, bk: any) => sum + countSeats(bk.seats),
      0
    );

    console.log(
      `[countApprovedSeats] eventId=${eventId} title="${eventTitle}" ` +
      `all_approved=${rows.length} matched=${matched.length} seats_taken=${totalSeatsBooked}`
    );

    return totalSeatsBooked;
  } catch (e) {
    console.error('[countApprovedSeats] threw:', e);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venue = searchParams.get('venue') || searchParams.get('source') || '';
    const seminar = searchParams.get('seminar') || searchParams.get('destination') || '';
    const date = searchParams.get('date') || '';
    const eventId = searchParams.get('eventId') || '';
    // displayTitle = the title shown in the frontend (may differ from DB title)
    // Used to match bookings that were stored with this frontend-overridden title
    const displayTitle = searchParams.get('displayTitle') || '';

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .eq('status', 'active')
      .gte('event_datetime', new Date().toISOString())
      .order('event_datetime', { ascending: true });

    if (eventId) query = query.eq('id', eventId);
    if (venue) query = query.ilike('venue', venue);
    if (seminar) query = query.ilike('title', seminar);
    if (date) {
      query = query
        .gte('event_datetime', `${date}T00:00:00`)
        .lt('event_datetime', `${date}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Events table fetch error, falling back to local seminars:', error);
      const localEvents = readDb().seminars
        .filter((item) => item.id.startsWith('seminar_'))
        .filter((item) => !venue || item.venue.toLowerCase() === venue.toLowerCase())
        .filter((item) => !seminar || item.seminar.toLowerCase() === seminar.toLowerCase())
        .map((item) => ({
          id: item.id,
          title: item.name,
          venue: item.venue,
          event_datetime: `${date || new Date().toISOString().split('T')[0]}T10:00:00`,
          price: item.registrationPrice,
          total_seats: DEFAULT_TOTAL_SEATS,
          status: 'active',
        }));

      const fallbackEvents = localEvents.map((event) => normalizeEvent(event));
      return NextResponse.json({ events: fallbackEvents });
    }

    const events = await Promise.all(
      (data || []).map(async (event) => {
        // Count approved bookings matching this event.
        // Pass both the DB title AND the frontend displayTitle so all booking variants match.
        const titlesToTry = [event.title || '', displayTitle].filter(Boolean);
        let approvedCount = 0;
        for (const t of titlesToTry) {
          const c = await countApprovedSeats(event.id, t);
          if (c > approvedCount) approvedCount = c;
        }
        return normalizeEvent(event, approvedCount);
      })
    );

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Events GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred fetching events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Admin authentication is required' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, username, role')
      .eq('id', adminId)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body.title || '').trim();
    const venue = String(body.venue || '').trim();
    const eventDateTime = String(body.eventDateTime || '').trim();
    const price = Number(body.price);
    const totalSeats = Number(body.totalSeats || DEFAULT_TOTAL_SEATS);

    if (!title || !venue || !eventDateTime || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Event title, venue, event date time, and valid fee are required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      return NextResponse.json({ error: 'Total available seats must be a positive number' }, { status: 400 });
    }

    const eventDate = new Date(eventDateTime);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Please provide a valid event date and time' }, { status: 400 });
    }

    const id = `seminar_${Date.now()}_${slugify(title) || 'event'}`;

    const eventPayload = {
      id,
      title,
      venue,
      event_datetime: eventDate.toISOString(),
      price,
      total_seats: totalSeats,
      status: 'active',
    };

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventPayload)
      .select('*')
      .single();

    if (eventError) {
      console.error('Event insert error:', eventError);
      return NextResponse.json({ error: eventError.message || 'Failed to publish seminar event' }, { status: 500 });
    }

    const eventTime = getTimePart(event.event_datetime);
    const { error: legacyError } = await supabaseAdmin
      .from('buses')
      .upsert({
        id: event.id,
        name: event.title,
        type: 'success team Event Event',
        status: DEFAULT_STATUS,
        source: event.venue,
        destination: event.title,
        price: event.price,
        duration: 'Scheduled Program',
        times: [eventTime],
      });

    if (legacyError) {
      console.error('Legacy seminar mirror upsert error:', legacyError);
    }

    return NextResponse.json({ event: normalizeEvent(event) }, { status: 201 });
  } catch (error: any) {
    console.error('Events POST error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred publishing the seminar event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Admin authentication is required' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, username, role')
      .eq('id', adminId)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const eventId = String(body.eventId || '').trim();
    const title = String(body.title || '').trim();
    const venue = String(body.venue || '').trim();
    const eventDateTime = String(body.eventDateTime || '').trim();
    const price = Number(body.price);
    const totalSeats = Number(body.totalSeats || DEFAULT_TOTAL_SEATS);

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!title || !venue || !eventDateTime || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Event title, venue, event date time, and valid fee are required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      return NextResponse.json({ error: 'Total available seats must be a positive number' }, { status: 400 });
    }

    const eventDate = new Date(eventDateTime);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Please provide a valid event date and time' }, { status: 400 });
    }

    // 1. Update events table
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .update({
        title,
        venue,
        event_datetime: eventDate.toISOString(),
        price,
        total_seats: totalSeats,
      })
      .eq('id', eventId);

    if (eventError) {
      console.error('Update event error:', eventError);
      return NextResponse.json({ error: eventError.message || 'Failed to update event' }, { status: 500 });
    }

    // 2. Update legacy buses table
    const eventTime = getTimePart(eventDate.toISOString());
    const { error: legacyError } = await supabaseAdmin
      .from('buses')
      .upsert({
        id: eventId,
        name: title,
        type: 'success team Event Event',
        status: DEFAULT_STATUS,
        source: venue,
        destination: title,
        price: price,
        duration: 'Scheduled Program',
        times: [eventTime],
      });

    if (legacyError) {
      console.error('Legacy seminar mirror update error:', legacyError);
    }

    return NextResponse.json({ success: true, message: 'Event updated successfully' });
  } catch (error: any) {
    console.error('Events PATCH error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred updating the event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Admin authentication is required' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, username, role')
      .eq('id', adminId)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // 1. Delete from events table
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (eventError) {
      console.error('Delete event error:', eventError);
      return NextResponse.json({ error: eventError.message || 'Failed to delete event' }, { status: 500 });
    }

    // 2. Delete from legacy buses table
    const { error: legacyError } = await supabaseAdmin
      .from('buses')
      .delete()
      .eq('id', eventId);

    if (legacyError) {
      console.error('Delete legacy bus error:', legacyError);
    }

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Events DELETE error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred deleting the event' },
      { status: 500 }
    );
  }
}



