import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminSession as verifyAuthSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

async function verifyAdminSession(request: Request) {
  try {
    return await verifyAuthSession(request);
  } catch {
    return null;
  }
}

function generateEventId() {
  const rand = Math.floor(Math.random() * 100000);
  return `event_${Date.now()}_${rand}`;
}

function formatEvent(e: any, bookedCount = 0) {
  let eventDate = '';
  let eventTime = '';
  if (e.event_datetime) {
    try {
      const d = new Date(e.event_datetime);
      if (!isNaN(d.getTime())) {
        eventDate = d.toISOString().split('T')[0];
        eventTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {}
  }

  const spr = e.seats_per_row || e.seatsPerRow || 20;
  const tr = e.total_rows || e.totalRows || 15;
  const total = e.total_seats || e.totalSeats || (spr * tr);
  const available = Math.max(0, total - bookedCount);

  return {
    ...e,
    id: e.id,
    title: e.title || e.name || '',
    name: e.title || e.name || '',
    venue: e.venue || '',
    eventDateTime: e.event_datetime || '',
    event_datetime: e.event_datetime || '',
    eventDate: eventDate || (e.event_datetime ? String(e.event_datetime).split('T')[0] : ''),
    eventTime: eventTime || '10:00 AM',
    price: Number(e.price) || 0,
    seatsPerRow: spr,
    seats_per_row: spr,
    totalRows: tr,
    total_rows: tr,
    totalSeats: total,
    total_seats: total,
    imageUrl: e.image_url || e.imageUrl || '',
    image_url: e.image_url || e.imageUrl || '',
    status: e.status || 'active',
    homepage_visible: e.homepage_visible !== false,
    homepageVisible: e.homepage_visible !== false,
    bookedCount,
    availableSeats: available,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastActive = searchParams.get('lastActive') === 'true';
    const displayTitle = searchParams.get('displayTitle');
    const venue = searchParams.get('venue');
    const seminar = searchParams.get('seminar');
    const date = searchParams.get('date');
    const eventId = searchParams.get('eventId');

    const isAdmin = request.headers.get('x-admin-id') !== null;

    // Fetch all events from DB
    let query = supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('status', 'active');
    }

    if (eventId) {
      query = query.eq('id', eventId);
    }

    if (venue) {
      query = query.eq('venue', venue);
    }

    if (seminar) {
      query = query.ilike('title', `%${seminar}%`);
    }

    if (date) {
      query = query.eq('event_datetime', date);
    }

    const { data: rawEvents, error: eventsError } = await query;

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    let allEvents = rawEvents || [];

    // Filter for homepage visibility when not in admin mode
    if (!isAdmin) {
      allEvents = allEvents.filter((e: any) => e.homepage_visible !== false);
    }

    // Fetch bookings to compute booked seat counts
    let bookingsMap: Record<string, number> = {};
    try {
      const { data: bookingsData } = await supabaseAdmin
        .from('bookings')
        .select('seminar_id, seminar_name, destination, seats, status')
        .in('status', ['approved', 'pending']);

      if (bookingsData) {
        bookingsData.forEach((b: any) => {
          const seatCount = Array.isArray(b.seats) ? b.seats.length : 0;
          const key1 = b.seminar_id;
          const key2 = b.seminar_name ? String(b.seminar_name).trim().toLowerCase() : '';
          const key3 = b.destination ? String(b.destination).trim().toLowerCase() : '';

          if (key1) bookingsMap[key1] = (bookingsMap[key1] || 0) + seatCount;
          if (key2) bookingsMap[key2] = (bookingsMap[key2] || 0) + seatCount;
          if (key3 && key3 !== key2) bookingsMap[key3] = (bookingsMap[key3] || 0) + seatCount;
        });
      }
    } catch (bErr) {
      console.warn('Unable to aggregate booking counts for events:', bErr);
    }

    const formattedEvents = allEvents.map((e: any) => {
      const idCount = bookingsMap[e.id] || 0;
      const titleCount = bookingsMap[String(e.title || '').trim().toLowerCase()] || 0;
      const totalBooked = Math.max(idCount, titleCount);
      return formatEvent(e, totalBooked);
    });

    if (lastActive) {
      if (formattedEvents.length === 0) {
        return NextResponse.json({ event: null });
      }
      return NextResponse.json({ event: formattedEvents[0] });
    }

    let resultEvents = formattedEvents;
    if (displayTitle) {
      const matched = resultEvents.find(e => e.title === displayTitle || e.name === displayTitle);
      if (matched) {
        resultEvents = [matched];
      }
    }

    return NextResponse.json({ events: resultEvents, dbTotalEventsCount: resultEvents.length });
  } catch (err: any) {
    console.error('Events GET error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, venue, eventDateTime, price, seatsPerRow, totalRows, totalSeats, imageUrl } = body;

    if (!title || !venue || !eventDateTime) {
      return NextResponse.json({ error: 'Title, venue, and event datetime are required' }, { status: 400 });
    }

    const id = generateEventId();
    const spr = Number(seatsPerRow) || 20;
    const tr = Number(totalRows) || 15;
    const total = Number(totalSeats) || spr * tr;

    let insertPayload: any = {
      id,
      title,
      venue,
      event_datetime: eventDateTime,
      price: Number(price) || 0,
      total_seats: total,
      seats_per_row: spr,
      total_rows: tr,
      status: 'active',
      image_url: imageUrl || null,
      homepage_visible: true,
    };

    let { data, error } = await supabaseAdmin
      .from('events')
      .insert(insertPayload)
      .select()
      .single();

    if (error && (error.message.includes('homepage_visible') || error.message.includes('column'))) {
      delete insertPayload.homepage_visible;
      const res = await supabaseAdmin
        .from('events')
        .insert(insertPayload)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event: formatEvent(data) }, { status: 201 });
  } catch (err: any) {
    console.error('Events POST error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, homepage_visible, title, venue, eventDateTime, price, totalSeats, seatsPerRow, totalRows, imageUrl, status } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const updatePayload: any = {};

    if (homepage_visible !== undefined) {
      updatePayload.homepage_visible = homepage_visible;
    }
    if (title !== undefined) updatePayload.title = title;
    if (venue !== undefined) updatePayload.venue = venue;
    if (eventDateTime !== undefined) updatePayload.event_datetime = eventDateTime;
    if (price !== undefined) updatePayload.price = Number(price);
    if (totalSeats !== undefined) updatePayload.total_seats = Number(totalSeats);
    if (seatsPerRow !== undefined) updatePayload.seats_per_row = Number(seatsPerRow);
    if (totalRows !== undefined) updatePayload.total_rows = Number(totalRows);
    if (imageUrl !== undefined) updatePayload.image_url = imageUrl;
    if (status !== undefined) updatePayload.status = status;

    let { data, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single();

    if (error && (error.message.includes('homepage_visible') || error.message.includes('column'))) {
      delete updatePayload.homepage_visible;
      const res = await supabaseAdmin
        .from('events')
        .update(updatePayload)
        .eq('id', eventId)
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    return NextResponse.json({ event: formatEvent(data) });
  } catch (err: any) {
    console.error('Events PATCH error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdminSession(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Events DELETE error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

