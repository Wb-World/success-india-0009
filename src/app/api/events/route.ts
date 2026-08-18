import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function verifyAdminSession(request: Request) {
  const adminId = request.headers.get('x-admin-id');
  if (!adminId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, username, name, role')
      .eq('id', adminId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

function generateEventId() {
  const rand = Math.floor(Math.random() * 100000);
  return `event_${Date.now()}_${rand}`;
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

    if (lastActive) {
      let lastActiveQuery = supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isAdmin) {
        lastActiveQuery = (lastActiveQuery as any)
          .eq('status', 'active')
          .or('homepage_visible.is.eq.true,homepage_visible.is.null');
      }

      const { data, error } = await lastActiveQuery;

      if (error) {
        console.error('Error fetching last active event:', error);
        return NextResponse.json({ error: 'Failed to fetch last active event' }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ event: null });
      }

      return NextResponse.json({ event: data });
    }

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query
        .eq('status', 'active')
        .or('homepage_visible.is.eq.true,homepage_visible.is.null');
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    let events = data || [];

    if (displayTitle) {
      const matched = events.find(e => e.title === displayTitle);
      if (matched) {
        events = [matched];
      }
    }

    return NextResponse.json({ events, dbTotalEventsCount: events.length });
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

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event: data }, { status: 201 });
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

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    return NextResponse.json({ event: data });
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
