import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readDb } from '@/lib/db';
import { isSeatValid } from '@/lib/seat-config';

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

function normalizeEvent(event: any, approvedBookedCount: number = 0, blockedCount: number = 0) {
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
    seatsPerRow: Number(event.seats_per_row || event.seatsPerRow || 20),
    totalRows: Number(event.total_rows || event.totalRows || 15),
    bookedCount: approvedBookedCount + blockedCount,
    availableSeats: Math.max(0, totalSeats - approvedBookedCount - blockedCount),
    status: event.status === 'inactive' ? 'Inactive' : DEFAULT_STATUS,
    imageUrl: event.image_url || event.imageUrl || null,
    homepage_visible: event.homepage_visible !== false,

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
async function countApprovedSeats(eventId: string, eventTitle: string, isLegacy: boolean): Promise<number> {
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
      // For legacy events, we match by both ID and title/destination for backwards compatibility.
      // For new events, we strictly match by ID only.
      if (!isLegacy) {
        const idKeys = [bk.seminar_id, bk.bus_id, bk.event_id, bk.eventId].map(normalizeComparable).filter(Boolean);
        return idKeys.includes(idKey);
      }

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
      `[countApprovedSeats] eventId=${eventId} title="${eventTitle}" isLegacy=${isLegacy} ` +
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

    const adminId = request.headers.get('x-admin-id');
    let isAuthorizedAdmin = false;
    if (adminId) {
      try {
        const { data: adminUser } = await supabaseAdmin
          .from('admin')
          .select('id')
          .eq('id', adminId)
          .maybeSingle();
        if (adminUser) {
          isAuthorizedAdmin = true;
        }
      } catch (e) {
        console.warn('Failed to verify admin header in events GET:', e);
      }
    }

    let query = supabaseAdmin
      .from('events')
      .select('*')
      .eq('status', 'active');

    if (!isAuthorizedAdmin) {
      query = query.gte('event_datetime', new Date().toISOString());
    }

    query = query.order('event_datetime', { ascending: true });

    if (eventId) query = query.eq('id', eventId);
    if (venue) query = query.ilike('venue', venue);
    if (seminar) query = query.ilike('title', seminar);
    if (date) {
      query = query
        .gte('event_datetime', `${date}T00:00:00`)
        .lt('event_datetime', `${date}T23:59:59`);
    }

    const res = await query;
    const rawData = res.data;
    const error = res.error;

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
      return NextResponse.json({ events: fallbackEvents, totalActiveCount: 0, dbTotalEventsCount: readDb().seminars.length });
    }

    // Count total events in database to check if database is initialized
    let dbTotalEventsCount = 0;
    try {
      const { count } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true });
      dbTotalEventsCount = count || 0;
    } catch (e) {
      console.warn('Failed to fetch total events count:', e);
    }

    const filteredData = (rawData || []).filter((event: any) => {
      if (isAuthorizedAdmin) return true;
      return event.homepage_visible !== false;
    });

    const events = await Promise.all(
      filteredData.map(async (event) => {
        // Count approved bookings matching this event.
        const isLegacyEvent = event.id === 'seminar_mega_mass_2026' || event.id === 'seminar_101';
        const titlesToTry = [event.title || '', isLegacyEvent ? displayTitle : ''].filter(Boolean);
        let approvedCount = 0;
        for (const t of titlesToTry) {
          const c = await countApprovedSeats(event.id, t, isLegacyEvent);
          if (c > approvedCount) approvedCount = c;
        }

        // Fetch blocked seats count for this event
        let blockedCount = 0;
        try {
          const { data: configData } = await supabaseAdmin
            .from('configs')
            .select('value')
            .eq('key', `blocked_seats_${event.id}`)
            .maybeSingle();
          if (configData?.value) {
            const parsed = JSON.parse(configData.value);
            if (Array.isArray(parsed)) {
              blockedCount = parsed.length;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch blocked seats for event count:', e);
        }

        return normalizeEvent(event, approvedCount, blockedCount);
      })
    );

    return NextResponse.json({ events, totalActiveCount: (rawData || []).length, dbTotalEventsCount });
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
    const seatsPerRow = Number(body.seatsPerRow);
    const totalRows = Number(body.totalRows);
    const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;

    if (!title || !venue || !eventDateTime || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Event title, venue, event date time, and valid fee are required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(seatsPerRow) || seatsPerRow <= 0) {
      return NextResponse.json({ error: 'Seats per row must be a positive integer' }, { status: 400 });
    }

    if (!Number.isInteger(totalRows) || totalRows <= 0) {
      return NextResponse.json({ error: 'Total number of rows must be a positive integer' }, { status: 400 });
    }

    const totalSeats = seatsPerRow * totalRows;

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
      seats_per_row: seatsPerRow,
      total_rows: totalRows,
      status: 'active',
      image_url: imageUrl,
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
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const homepageVisible = body.homepage_visible;
    if (homepageVisible !== undefined) {
      const { error: eventError } = await supabaseAdmin
        .from('events')
        .update({ homepage_visible: homepageVisible })
        .eq('id', eventId);

      if (eventError) {
        console.error('Update event visibility error:', eventError);
        const isColumnError = eventError.message.includes('homepage_visible');
        return NextResponse.json(
          { 
            error: isColumnError
              ? 'Failed to update event visibility. The homepage_visible column does not exist in the database. Please execute the SQL migration in your Supabase SQL Editor.'
              : eventError.message || 'Failed to update event visibility'
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Event visibility updated successfully' });
    }

    const title = String(body.title || '').trim();
    const venue = String(body.venue || '').trim();
    const eventDateTime = String(body.eventDateTime || '').trim();
    const price = Number(body.price);
    const seatsPerRow = Number(body.seatsPerRow);
    const totalRows = Number(body.totalRows);
    const imageUrl = body.imageUrl !== undefined ? (body.imageUrl ? String(body.imageUrl).trim() : null) : undefined;

    if (!title || !venue || !eventDateTime || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: 'Event title, venue, event date time, and valid fee are required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(seatsPerRow) || seatsPerRow <= 0) {
      return NextResponse.json({ error: 'Seats per row must be a positive integer' }, { status: 400 });
    }

    if (!Number.isInteger(totalRows) || totalRows <= 0) {
      return NextResponse.json({ error: 'Total number of rows must be a positive integer' }, { status: 400 });
    }

    const totalSeats = seatsPerRow * totalRows;

    const eventDate = new Date(eventDateTime);
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Please provide a valid event date and time' }, { status: 400 });
    }

    // Validate that no booked seats become invalid under the new layout
    try {
      let bookingsData: any[] = [];
      let querySucceeded = false;

      try {
        const { data, error } = await supabaseAdmin
          .from('bookings')
          .select('seats')
          .or(`seminar_id.eq.${eventId},bus_id.eq.${eventId}`)
          .in('status', ['approved', 'pending']);

        if (!error) {
          bookingsData = data || [];
          querySucceeded = true;
        } else {
          console.warn('[events PATCH] OR query failed, falling back to bus_id only:', error.message);
        }
      } catch (e) {
        console.warn('[events PATCH] OR query threw, falling back:', e);
      }

      // Fallback: query bus_id only (if seminar_id column doesn't exist in the database)
      if (!querySucceeded) {
        const { data, error: fallbackError } = await supabaseAdmin
          .from('bookings')
          .select('seats')
          .eq('bus_id', eventId)
          .in('status', ['approved', 'pending']);

        if (fallbackError) {
          console.error('Failed to fetch bookings for validation (fallback):', fallbackError);
          return NextResponse.json({ error: 'Failed to validate existing bookings before update' }, { status: 500 });
        }
        bookingsData = data || [];
      }

      const takenSeats = (bookingsData || []).flatMap((bk: any) => bk.seats || []);
      const invalidSeats: string[] = [];
      for (const seat of takenSeats) {
        if (!isSeatValid(seat, seatsPerRow, totalRows)) {
          invalidSeats.push(seat);
        }
      }

      if (invalidSeats.length > 0) {
        return NextResponse.json({
          error: `Cannot reduce layout because some booked seats would become invalid: ${Array.from(new Set(invalidSeats)).join(', ')}`
        }, { status: 400 });
      }
    } catch (e) {
      console.error('Error validating booked seats on layout reduction:', e);
      return NextResponse.json({ error: 'Error validating existing bookings' }, { status: 500 });
    }

    // Fetch existing event for image URL comparison before update
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('image_url')
      .eq('id', eventId)
      .maybeSingle();

    // 1. Update events table
    const updatePayload: any = {
      title,
      venue,
      event_datetime: eventDate.toISOString(),
      price,
      total_seats: totalSeats,
      seats_per_row: seatsPerRow,
      total_rows: totalRows,
    };
    if (imageUrl !== undefined) {
      updatePayload.image_url = imageUrl;
    }

    const { error: eventError } = await supabaseAdmin
      .from('events')
      .update(updatePayload)
      .eq('id', eventId);

    if (eventError) {
      console.error('Update event error:', eventError);
      return NextResponse.json({ error: eventError.message || 'Failed to update event' }, { status: 500 });
    }

    // If update succeeded, delete old file from storage if new image is different or removed
    if (existingEvent && imageUrl !== undefined && existingEvent.image_url !== imageUrl) {
      const oldUrl = existingEvent.image_url;
      if (oldUrl && oldUrl.includes('/event-banners/')) {
        try {
          const parts = oldUrl.split('/event-banners/');
          if (parts.length > 1) {
            const fileName = parts[1];
            await supabaseAdmin.storage.from('event-banners').remove([fileName]);
            console.log('Successfully deleted old banner from storage:', fileName);
          }
        } catch (delErr) {
          console.error('Failed to delete old banner from storage:', delErr);
        }
      }
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

    // Fetch existing event to get image_url for deletion
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('image_url')
      .eq('id', eventId)
      .maybeSingle();

    // 1. Delete from events table
    const { error: eventError } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', eventId);

    if (eventError) {
      console.error('Delete event error:', eventError);
      return NextResponse.json({ error: eventError.message || 'Failed to delete event' }, { status: 500 });
    }

    // If deletion from DB succeeded, delete banner from storage
    if (existingEvent?.image_url && existingEvent.image_url.includes('/event-banners/')) {
      try {
        const parts = existingEvent.image_url.split('/event-banners/');
        if (parts.length > 1) {
          const fileName = parts[1];
          await supabaseAdmin.storage.from('event-banners').remove([fileName]);
          console.log('Successfully deleted deleted-event banner from storage:', fileName);
        }
      } catch (delErr) {
        console.error('Failed to delete banner on event deletion:', delErr);
      }
    }

    // 2. Delete from legacy buses table
    const { error: legacyError } = await supabaseAdmin
      .from('buses')
      .delete()
      .eq('id', eventId);

    if (legacyError) {
      console.error('Delete legacy bus error:', legacyError);
    }

    // 3. Delete blocked seats config
    try {
      await supabaseAdmin
        .from('configs')
        .delete()
        .eq('key', `blocked_seats_${eventId}`);
    } catch (e) {
      console.warn('Failed to delete blocked seats config:', e);
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



