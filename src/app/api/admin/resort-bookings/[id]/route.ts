import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

import { verifyAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status || !['CONFIRMED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be CONFIRMED or REJECTED' },
        { status: 400 }
      );
    }

    // Update resort booking in Supabase
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('resort_bookings')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updatedBooking) {
      console.error('Database update error for resort booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update resort booking status' },
        { status: 500 }
      );
    }

    // Trigger user notification when status is approved or denied
    try {
      const { createNotification } = await import('@/lib/notifications');
      const userId = updatedBooking.user_id;
      const accommodation = updatedBooking.accommodation_type;
      
      if (userId) {
        if (status === 'CONFIRMED') {
          await createNotification(
            userId,
            'Resort Booking Confirmed 🎉',
            `Your booking request for "${accommodation}" has been verified and confirmed.`
          );
        } else if (status === 'REJECTED') {
          await createNotification(
            userId,
            'Resort Booking Rejected ❌',
            `Your booking request for "${accommodation}" was rejected. Please contact support.`
          );
        }
      }
    } catch (notifErr) {
      console.warn('Failed to send notification for resort booking:', notifErr);
    }

    return NextResponse.json({ success: true, booking: updatedBooking }, { status: 200 });

  } catch (error) {
    console.error('Admin resort booking PATCH error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
