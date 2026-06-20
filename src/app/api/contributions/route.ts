import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('id, attendee_details, created_at, screenshot')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved contributions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter and map only supporter registrations (starting with SUP-)
    const supporters = (bookings || [])
      .filter((b: any) => b.id.startsWith('SUP-'))
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
