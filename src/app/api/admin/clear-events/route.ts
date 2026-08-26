import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

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
        error: 'Failed to fetch events',
      }, { status: 500 });
    }

    // If confirm is not set, return listing as a safety checkpoint
    if (!confirm) {
      return NextResponse.json({
        message: 'To permanently delete all events and legacy bus mappings, please append "?confirm=true".',
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
        error: 'Failed to delete events',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All events and legacy bus mapping entries have been deleted successfully.',
      clearedCounts: {
        eventsTable: events?.length || 0,
        busesTable: buses?.length || 0,
      }
    });
  } catch (error: any) {
    console.error('Clear events endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
