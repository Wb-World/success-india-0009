import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendBookingApprovalNotification } from '@/lib/whatsapp';

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
    const { status, homepage_visible } = await request.json();

    if (status === undefined && homepage_visible === undefined) {
      return NextResponse.json(
        { error: 'Missing parameters. Must provide status or homepage_visible' },
        { status: 400 }
      );
    }

    if (status !== undefined && !['approved', 'denied'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or denied' },
        { status: 400 }
      );
    }

    // Fetch current booking state to verify existing status and whatsapp_sent flag
    const { data: currentBooking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentBooking) {
      console.error('Database fetch error for booking:', fetchError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const wasAlreadyApproved = currentBooking.status === 'approved';
    const isWhatsappAlreadySent = currentBooking.whatsapp_sent === true ||
      (currentBooking.attendee_details && (currentBooking.attendee_details as any).__whatsapp_sent === true);

    const updatePayload: any = {};
    if (status !== undefined) updatePayload.status = status;
    if (homepage_visible !== undefined) updatePayload.homepage_visible = homepage_visible;

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

    // Trigger WhatsApp notification if status is updated to 'approved' and was not sent yet
    if (status === 'approved' && !isWhatsappAlreadySent) {
      let resolvedPhone = updatedBooking.booker_phone || (updatedBooking.attendee_details && (updatedBooking.attendee_details as any).__booker_phone) || '';
      
      // Fallback: If no booker_phone, check attendee_details for the first available whatsapp number
      if (!resolvedPhone && updatedBooking.attendee_details) {
        try {
          const details = updatedBooking.attendee_details as Record<string, any>;
          for (const seat of Object.keys(details)) {
            if (details[seat]?.whatsapp) {
              resolvedPhone = details[seat].whatsapp;
              break;
            }
          }
        } catch (_) {}
      }

      if (resolvedPhone) {
        try {
          console.log(`[WhatsApp Approval] Dispatched notification for booking ID: ${id} to recipient: ${resolvedPhone}`);
          await sendBookingApprovalNotification({
            bookingId: updatedBooking.id,
            eventName: updatedBooking.seminar_name || updatedBooking.bus_name || 'Seminar Event',
            venue: updatedBooking.source,
            date: updatedBooking.date,
            time: updatedBooking.time,
            seats: updatedBooking.seats || [],
            totalPrice: updatedBooking.total_price,
            bookerName: updatedBooking.booker_name || 'Guest',
            bookerPhone: resolvedPhone,
          });

          // Attempt to update whatsapp_sent flag in database column
          const { error: columnError } = await supabaseAdmin
            .from('bookings')
            .update({ whatsapp_sent: true })
            .eq('id', id);

          if (columnError) {
            console.warn('[WhatsApp Approval] whatsapp_sent column is likely missing. Using attendee_details fallback.', columnError.message);
            // Fallback: Store sent flag inside attendee_details JSONB metadata
            const currentDetails = updatedBooking.attendee_details || {};
            await supabaseAdmin
              .from('bookings')
              .update({
                attendee_details: {
                  ...(currentDetails as any),
                  __whatsapp_sent: true
                }
              })
              .eq('id', id);
          }
        } catch (waErr: any) {
          console.error(`[WhatsApp Approval Failed] Error sending confirmation to ${resolvedPhone} for booking ${id}:`, waErr.message || waErr);
          // Non-blocking: Do not fail the API response if the external WhatsApp service fails
        }
      } else {
        console.warn(`[WhatsApp Approval Warning] No phone number available to notify for booking ID: ${id}`);
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

