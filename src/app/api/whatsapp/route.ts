import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const businessId = process.env.WHATSAPP_BUSINESS_ID;

    // Log the check, ensuring credentials are not fully printed for security
    console.log('[WhatsApp API] Environment variables loaded:', {
      hasToken: !!token,
      hasPhoneId: !!phoneId,
      hasBusinessId: !!businessId,
    });

    if (!token || !phoneId || !businessId) {
      console.error('[WhatsApp API] Server configuration error: Missing environment variables.');
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp configuration is incomplete on the server.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      bookingId,
      eventName,
      venue,
      date,
      seats,
      totalPrice,
      bookerName,
      bookerPhone,
    } = body;

    if (!bookerPhone) {
      console.error('[WhatsApp API] Missing recipient phone number.');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Recipient phone number is required.' 
        },
        { status: 400 }
      );
    }

    // Standardize/normalize recipient phone number: remove non-digit characters
    let cleanNumber = bookerPhone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber; // Prepend India country code by default
    }

    console.log(`[WhatsApp API] Preparing message dispatch to: ${cleanNumber}`);

    // Build user-friendly message body
    const seatsText = Array.isArray(seats) ? seats.join(', ') : (seats || 'N/A');
    const messageBody = `Hello ${bookerName || 'Guest'},

Your registration has been submitted successfully!

Booking Details:
----------------------------------
Booking ID: ${bookingId || 'N/A'}
Event: ${eventName || 'N/A'}
Seats: ${seatsText}
Date: ${date || 'N/A'}
Venue: ${venue || 'N/A'}
Total Amount: INR ${totalPrice || '0'}
----------------------------------

We look forward to seeing you at the event. Thank you!`;

    const endpoint = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanNumber,
        type: 'text',
        text: {
          preview_url: true,
          body: messageBody,
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp API] Meta Cloud API returned an error:', {
        status: response.status,
        data: responseData,
      });
      return NextResponse.json(
        {
          success: false,
          error: responseData.error?.message || 'Failed to send WhatsApp message via Meta API.',
        },
        { status: response.status }
      );
    }

    console.log('[WhatsApp API] Message dispatched successfully:', {
      recipient: cleanNumber,
      messageId: responseData.messages?.[0]?.id,
    });

    return NextResponse.json({
      success: true,
      messageId: responseData.messages?.[0]?.id,
    });
  } catch (error: any) {
    console.error('[WhatsApp API] Exception caught during message dispatch:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error during message dispatch.',
      },
      { status: 500 }
    );
  }
}
