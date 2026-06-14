import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role in Supabase
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['approved', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or denied' },
        { status: 400 }
      );
    }

    // Update booking in Supabase
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedBooking) {
      console.error('Database update error for booking:', updateError);
      return NextResponse.json(
        { error: 'Booking not found or failed to update' },
        { status: 404 }
      );
    }

    // Map snake_case -> camelCase for the frontend
    const mappedBooking = {
      id: updatedBooking.id,
      userId: updatedBooking.user_id,
      seminarId: updatedBooking.seminar_id,
      seminarName: updatedBooking.seminar_name,
      eventId: updatedBooking.seminar_id || updatedBooking.bus_id,
      eventName: updatedBooking.seminar_name || updatedBooking.bus_name,
      seminarName: updatedBooking.seminar_name || updatedBooking.bus_name,
      venue: updatedBooking.source,
      seminar: updatedBooking.destination,
      source: updatedBooking.source,
      destination: updatedBooking.destination,
      date: updatedBooking.date,
      time: updatedBooking.time,
      seats: updatedBooking.seats || [],
      totalPrice: updatedBooking.total_price,
      screenshot: updatedBooking.screenshot,
      status: updatedBooking.status,
      createdAt: updatedBooking.created_at,
    };

    return NextResponse.json({ booking: mappedBooking });
  } catch (error) {
    console.error('Admin booking status PATCH error:', error);
    return NextResponse.json(
      { error: 'An error occurred updating booking status' },
      { status: 500 }
    );
  }
}

