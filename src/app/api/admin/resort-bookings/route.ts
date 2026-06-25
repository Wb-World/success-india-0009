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

    // Fetch all resort bookings sorted by created_at descending
    const { data: resortBookings, error: dbError } = await supabaseAdmin
      .from('resort_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database query error fetching admin resort bookings:', dbError);
      return NextResponse.json(
        { error: 'Failed to retrieve resort bookings from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ resortBookings: resortBookings || [] }, { status: 200 });

  } catch (error) {
    console.error('Admin resort bookings GET error:', error);
    return NextResponse.json(
      { error: 'An error occurred fetching resort bookings' },
      { status: 500 }
    );
  }
}
