import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm') === 'true';

    // 1. Fetch current database events to show what is present
    const { data: events, error: fetchEventsErr } = await supabaseAdmin
      .from('events')
      .select('*');

    const { data: buses, error: fetchBusesErr } = await supabaseAdmin
      .from('buses')
      .select('*');

    if (fetchEventsErr || fetchBusesErr) {
      console.error('Fetch errors:', { fetchEventsErr, fetchBusesErr });
      return NextResponse.json({
        error: 'Failed to fetch events from Supabase',
        eventsError: fetchEventsErr?.message,
        busesError: fetchBusesErr?.message,
      }, { status: 500 });
    }

    // If confirm is not set, return listing as a safety checkpoint
    if (!confirm) {
      return NextResponse.json({
        message: 'To permanently delete all events and legacy bus mappings in your Supabase database, please visit this URL with "?confirm=true".',
        counts: {
          eventsTable: events?.length || 0,
          busesTable: buses?.length || 0,
        },
        events,
        buses,
      });
    }

    // 2. Perform deletion from both tables
    const { error: deleteEventsErr } = await supabaseAdmin
      .from('events')
      .delete()
      .neq('id', ''); // Delete all rows

    const { error: deleteBusesErr } = await supabaseAdmin
      .from('buses')
      .delete()
      .neq('id', ''); // Delete all rows

    if (deleteEventsErr || deleteBusesErr) {
      console.error('Deletion errors:', { deleteEventsErr, deleteBusesErr });
      return NextResponse.json({
        error: 'Failed to delete events from Supabase',
        eventsError: deleteEventsErr?.message,
        busesError: deleteBusesErr?.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All dummy events and legacy bus mapping entries have been deleted successfully from Supabase!',
      clearedCounts: {
        eventsTable: events?.length || 0,
        busesTable: buses?.length || 0,
      }
    });
  } catch (error: any) {
    console.error('Clear events endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
