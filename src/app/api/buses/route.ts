import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { readDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || '';
    const destination = searchParams.get('destination') || '';
    const date = searchParams.get('date') || '';

    if (!source || !destination || !date) {
      return NextResponse.json(
        { error: 'Source, destination, and date are required' },
        { status: 400 }
      );
    }

    // Get matching buses (case-insensitive)
    const { data: buses, error: busError } = await supabaseAdmin
      .from('buses')
      .select('*')
      .ilike('source', source)
      .ilike('destination', destination);

    if (busError) {
      console.error('Buses fetch error:', busError);
      return NextResponse.json({ error: 'Failed to fetch buses' }, { status: 500 });
    }

    if (!buses || buses.length === 0) {
      const localBuses = readDb().buses.filter(
        (bus) =>
          bus.source.toLowerCase() === source.toLowerCase() &&
          bus.destination.toLowerCase() === destination.toLowerCase()
      );

      const localBusesWithAvailability = localBuses.map((bus) => ({
        ...bus,
        bookedSeatsByTime: bus.times.reduce<Record<string, string[]>>((acc, time) => {
          acc[time] = [];
          return acc;
        }, {}),
      }));

      return NextResponse.json({ buses: localBusesWithAvailability });
    }

    // Get approved bookings for these buses on the given date
    const busIds = buses.map((b) => b.id);
    const { data: approvedBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('bus_id, time, seats')
      .in('bus_id', busIds)
      .eq('date', date)
      .eq('status', 'approved');

    if (bookingError) {
      console.error('Bookings fetch error:', bookingError);
    }

    // Build booked seats map per bus per time
    const busesWithAvailability = buses.map((bus) => {
      const bookedSeatsByTime: Record<string, string[]> = {};

      bus.times.forEach((time: string) => {
        const timeBookings = (approvedBookings || []).filter(
          (bk) => bk.bus_id === bus.id && bk.time === time
        );
        const seats = timeBookings.reduce<string[]>((acc, bk) => {
          return [...acc, ...(bk.seats || [])];
        }, []);
        bookedSeatsByTime[time] = seats;
      });

      return { ...bus, bookedSeatsByTime };
    });

    return NextResponse.json({ buses: busesWithAvailability });
  } catch (error: any) {
    console.error('Buses GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred fetching buses' },
      { status: 500 }
    );
  }
}
