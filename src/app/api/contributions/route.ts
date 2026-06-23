import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let bookings: any[] | null = null;
    let error: any = null;

    const { data: queryData, error: queryError } = await supabaseAdmin
      .from('bookings')
      .select('id, attendee_details, created_at, screenshot, homepage_visible')
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    bookings = queryData;
    error = queryError;

    // Graceful fallback if column homepage_visible does not exist in db yet
    if (error && error.message.includes('homepage_visible')) {
      const fallbackQuery = supabaseAdmin
        .from('bookings')
        .select('id, attendee_details, created_at, screenshot')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      const res = await fallbackQuery;
      bookings = res.data;
      error = res.error;
    }

    if (error) {
      console.error('Error fetching approved contributions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter and map only supporter registrations (starting with SUP-) and homepage_visible = true
    const supporters = (bookings || [])
      .filter((b: any) => b.id.startsWith('SUP-') && b.homepage_visible !== false)
      .map((b: any) => {
        let attendees = b.attendee_details || {};
        const screenshot = b.screenshot || '';
        if ((!attendees || Object.keys(attendees).length === 0 || !attendees.SUPPORTER) && screenshot.includes('|')) {
          const parts = screenshot.split('|');
          try {
            attendees = JSON.parse(parts[1] || '{}');
          } catch (e) {
            console.error('Failed to parse fallback attendees JSON:', e);
          }
        }
        const supporter = attendees.SUPPORTER || {};
        return {
          id: b.id,
          name: supporter.name || 'System Supporter',
          vpName: supporter.vpName || '',
          vpImage: supporter.vpImage || '',
          designation: supporter.designation || 'System Supporter',
          createdAt: b.created_at,
        };
      })
      .filter((s: any) => s.vpImage); // Only include supporters with images

    return NextResponse.json({ supporters });
  } catch (err: any) {
    console.error('Error in GET /api/contributions:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}

