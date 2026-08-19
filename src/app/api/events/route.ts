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

    // Fetch bookings and configs to compute booked seat counts
    let allBookings: any[] = [];
    try {
      const { data: bookingsData, error: bError } = await supabaseAdmin
        .from('bookings')
        .select('*');

      if (!bError && bookingsData) {
        // Filter out cancelled / rejected / denied bookings
        allBookings = bookingsData.filter((b: any) => {
          const st = String(b.status || '').toLowerCase().trim();
          return st !== 'cancelled' && st !== 'rejected' && st !== 'denied';
        });
      }
    } catch (bErr) {
      console.warn('Unable to aggregate booking counts for events:', bErr);
    }

    // Fetch blocked seats configs
    let configsMap: Record<string, string[]> = {};
    try {
      const { data: configRows } = await supabaseAdmin
        .from('configs')
        .select('key, value');
      if (configRows) {
        configRows.forEach((c: any) => {
          if (c.key && c.value) {
            try {
              const parsed = JSON.parse(c.value);
              if (Array.isArray(parsed)) {
                configsMap[c.key] = parsed;
              }
            } catch {}
          }
        });
      }
    } catch (cErr) {
      console.warn('Unable to load configs for blocked seats:', cErr);
    }

    const formattedEvents = allEvents.map((e: any) => {
      const eId = String(e.id || '').trim().toLowerCase();
      const eTitle = String(e.title || e.name || '').trim().toLowerCase();
      const isPrimary = eId === 'seminar_101' || eId === 'seminar_mega_mass_2026';
      const dispTitleNorm = displayTitle ? String(displayTitle).trim().toLowerCase() : '';

      const seatSet = new Set<string>();

      allBookings.forEach((b: any) => {
        const bSemId = String(b.seminar_id || '').trim().toLowerCase();
        const bBusId = String(b.bus_id || '').trim().toLowerCase();
        const bDest = String(b.destination || '').trim().toLowerCase();
        const bSemName = String(b.seminar_name || '').trim().toLowerCase();
        const bBusName = String(b.bus_name || '').trim().toLowerCase();

        let matches = false;
        if (bSemId && bSemId === eId) matches = true;
        else if (bBusId && bBusId === eId) matches = true;
        else if (isPrimary && (bSemId === 'seminar_101' || bSemId === 'seminar_mega_mass_2026' || bBusId === 'seminar_101' || bBusId === 'seminar_mega_mass_2026')) matches = true;
        else if (eTitle && bDest && bDest === eTitle) matches = true;
        else if (eTitle && bSemName && bSemName === eTitle) matches = true;
        else if (eTitle && bBusName && bBusName === eTitle) matches = true;
        else if (isPrimary && dispTitleNorm && (bDest === dispTitleNorm || bSemName === dispTitleNorm)) matches = true;

        if (matches) {
          if (Array.isArray(b.seats)) {
            b.seats.forEach((s: any) => {
              const str = String(s || '').trim();
              if (str) seatSet.add(str);
            });
          } else if (typeof b.seats === 'string' && b.seats.trim()) {
            b.seats.split(',').forEach((s: string) => {
              const str = s.trim();
              if (str) seatSet.add(str);
            });
          }
        }
      });

      // Include admin blocked seats if any
      const blockedKeys = isPrimary
        ? [`blocked_seats_${e.id}`, `blocked_seats_seminar_mega_mass_2026`, `blocked_seats_seminar_101`]
        : [`blocked_seats_${e.id}`];

      blockedKeys.forEach(k => {
        if (configsMap[k]) {
          configsMap[k].forEach(s => {
            const str = String(s || '').trim();
            if (str) seatSet.add(str);
          });
        }
      });

      const totalBooked = seatSet.size;
      return formatEvent(e, totalBooked);
    });

    const responseHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (lastActive) {
      if (formattedEvents.length === 0) {
        return NextResponse.json({ event: null }, { headers: responseHeaders });
      }
      return NextResponse.json({ event: formattedEvents[0] }, { headers: responseHeaders });
    }

    let resultEvents = formattedEvents;
    if (displayTitle) {
      const matched = resultEvents.find(e => e.title === displayTitle || e.name === displayTitle);
      if (matched) {
        resultEvents = [matched];
      }
    }

    return NextResponse.json(
      { events: resultEvents, dbTotalEventsCount: formattedEvents.length },
      { headers: responseHeaders }
    );
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

