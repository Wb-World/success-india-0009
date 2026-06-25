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
    const { status, homepage_visible, attendee_details } = await request.json();

    if (status === undefined && homepage_visible === undefined && attendee_details === undefined) {
      return NextResponse.json(
        { error: 'Missing parameters. Must provide status, homepage_visible or attendee_details' },
        { status: 400 }
      );
    }

    if (status !== undefined && !['approved', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or denied' },
        { status: 400 }
      );
    }

    const updatePayload: any = {};
    if (status !== undefined) updatePayload.status = status;
    if (homepage_visible !== undefined) updatePayload.homepage_visible = homepage_visible;
    if (attendee_details !== undefined) updatePayload.attendee_details = attendee_details;

    // Automatically default homepage_visible to true when approving a contributor registration if not explicitly specified
    if (id.startsWith('SUP-') && status === 'approved' && homepage_visible === undefined) {
      updatePayload.homepage_visible = true;
    }

    // Update booking in Supabase
    let { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    // Fallback in case column homepage_visible does not exist in db yet
    if (updateError && updateError.message.includes('homepage_visible')) {
      const fallbackPayload = { ...updatePayload };
      delete fallbackPayload.homepage_visible;
      const fallbackRes = await supabaseAdmin
        .from('bookings')
        .update(fallbackPayload)
        .eq('id', id)
        .select('*')
        .single();
      updatedBooking = fallbackRes.data;
      updateError = fallbackRes.error;
    }

    if (updateError || !updatedBooking) {
      console.error('Database update error for booking:', updateError);
      const isHomepageVisibleToggleError = homepage_visible !== undefined && status === undefined;
      const errorMsg = isHomepageVisibleToggleError
        ? 'Failed to update homepage visibility. The homepage_visible column does not exist in the database. Please execute the SQL migration in your Supabase SQL Editor.'
        : 'Failed to update booking status';
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }

    // Trigger user notification when status is approved or denied
    if (status !== undefined && updatedBooking) {
      try {
        const { createNotification } = await import('@/lib/notifications');
        const eventName = updatedBooking.seminar_name || updatedBooking.bus_name || 'Success Team Seminar';
        const userId = updatedBooking.user_id;
        
        if (userId) {
          if (status === 'approved') {
            await createNotification(
              userId,
              'Seat Confirmed 🎉',
              `Your seat for "${eventName}" has been confirmed successfully.`
            );
          } else if (status === 'denied') {
            await createNotification(
              userId,
              'Booking Rejected',
              'Your booking request could not be approved. Please contact support.'
            );
          }
        }
      } catch (notifErr) {
        console.error('Failed to trigger user notification:', notifErr);
      }
    }


    let cleanScreenshot = updatedBooking.screenshot || '';
    let attendees = {};
    if (cleanScreenshot.includes('|')) {
      const parts = cleanScreenshot.split('|');
      cleanScreenshot = parts[0];
      try {
        attendees = JSON.parse(parts[1] || '{}');
      } catch (e) {
        console.error('Failed to parse attendees json:', e);
      }
    }

    // Map snake_case -> camelCase for the frontend
    const mappedBooking = {
      id: updatedBooking.id,
      userId: updatedBooking.user_id,
      seminarId: updatedBooking.seminar_id,
      eventId: updatedBooking.seminar_id || updatedBooking.bus_id,
      eventName: updatedBooking.seminar_name || updatedBooking.bus_name,
      seminarName: updatedBooking.seminar_name || updatedBooking.bus_name,
      venue: updatedBooking.source,
      seminar: updatedBooking.destination,
      date: updatedBooking.date,
      time: updatedBooking.time,
      seats: updatedBooking.seats || [],
      totalPrice: updatedBooking.total_price,
      screenshot: cleanScreenshot,
      attendees: attendees,
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

