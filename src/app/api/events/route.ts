import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_TOTAL_SEATS = 60;
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

function normalizeEvent(event: any, bookedSeatsByTime: Record<string, string[]> = {}) {
  const eventDateTime = event.event_datetime || event.eventDateTime || event.datetime;
  const eventDate = getDatePart(eventDateTime);
  const eventTime = getTimePart(eventDateTime);

  return {
    id: event.id,
    eventId: event.id,
    title: event.title,
    venue: event.venue,
    eventDateTime,
    eventDate,
    eventTime,
    price: Number(event.price || 0),
    totalSeats: Number(event.total_seats || event.totalSeats || DEFAULT_TOTAL_SEATS),
    status: event.status === 'inactive' ? 'Inactive' : DEFAULT_STATUS,

    // Compatibility shape consumed by existing seat selection components.
    name: event.title,
    type: 'Success India Seminar Event',
    duration: 'Scheduled Program',
    times: [eventTime],
    bookedSeatsByTime: {
      [eventTime]: bookedSeatsByTime[eventTime] || [],
    },
  };
}

async function getApprovedSeatMap(eventIds: string[], date?: string) {
  if (eventIds.length === 0) return {};

  let query = supabaseAdmin
    .from('bookings')
    .select('seminar_id, bus_id, time, seats')
    .eq('status', 'approved');

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) {
    console.error('Event booking availability fetch error:', error);
    return {};
  }

  return (data || []).reduce<Record<string, Record<string, string[]>>>((acc, booking: any) => {
    const id = booking.seminar_id || booking.bus_id;
    if (!eventIds.includes(id)) return acc;
    if (!acc[id]) acc[id] = {};
    if (!acc[id][booking.time]) acc[id][booking.time] = [];
    acc[id][booking.time].push(...(booking.seats || []));
    return acc;
  }, {});
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const venue = searchParams.get('venue') || searchParams.get('source') || '';
    const seminar = searchParams.get('seminar') || searchParams.get('destination') || '';
    const date = searchParams.get('date') || '';
    const eventId = searchParams.get('eventId') || '';

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

    const eventIds = (data || []).map((event) => event.id);
    const seatMap = await getApprovedSeatMap(eventIds, date);
    const events = (data || []).map((event) => normalizeEvent(event, seatMap[event.id] || {}));

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
      .from('users')
      .select('id, role')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

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
        { error: 'Seminar title, venue, event date time, and valid fee are required' },
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
        type: 'Success India Seminar Event',
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
      .from('users')
      .select('id, role')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

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
        { error: 'Seminar title, venue, event date time, and valid fee are required' },
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
        type: 'Success India Seminar Event',
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
      .from('users')
      .select('id, role')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

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

