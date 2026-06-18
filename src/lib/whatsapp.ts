/**
 * Meta WhatsApp Cloud API Integration Utility
 * Handles sending templates or standard text messages to registered WhatsApp numbers.
 */

interface SendWhatsAppParams {
  attendeeName: string;
  seatNumber: string;
  eventDate: string;
  venue: string;
  whatsappNumber: string;
  qrImageUrl: string;
}

export async function sendMetaWhatsAppTicket({
  attendeeName,
  seatNumber,
  eventDate,
  venue,
  whatsappNumber,
  qrImageUrl,
}: SendWhatsAppParams) {
  const metaToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_ID;

  if (!metaToken || !phoneNumberId) {
    console.error('WhatsApp API credentials (META_WHATSAPP_TOKEN/WHATSAPP_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_PHONE_ID) are not configured in environment variables.');
    throw new Error('Meta WhatsApp Cloud API credentials are not configured.');
  }

  // Format recipient's phone number: must have country code, no +, no spaces
  // Default to +91 (India) if it's 10 digits and doesn't start with country code
  let cleanNumber = whatsappNumber.replace(/[\s\-\(\)\+]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber; // Prepend India country code by default
  }

  // Build the message body using the required template text
  const messageBody = `Hello ${attendeeName},

Your booking has been received successfully.

Event:
Success Team Leadership Development Seminar

Seat Number:
${seatNumber}

Date:
${eventDate}

Venue:
${venue}

Booking QR Code Link:
${qrImageUrl}

Please keep this QR code ready for event entry.

Thank you.`;

  console.log(`[Meta WhatsApp] Dispatching ticket message to recipient: ${cleanNumber}`);

  const endpoint = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${metaToken}`,
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
    console.error(`[Meta WhatsApp Error] Status: ${response.status}`, responseData);
    throw new Error(responseData.error?.message || 'Failed to dispatch Meta WhatsApp message');
  }

  console.log(`[Meta WhatsApp Success] Message sent successfully:`, responseData);
  return responseData;
}

interface ApprovalNotificationParams {
  bookingId: string;
  eventName: string;
  venue: string;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  bookerName: string;
  bookerPhone: string;
}

export async function sendBookingApprovalNotification({
  bookingId,
  eventName,
  venue,
  date,
  time,
  seats,
  totalPrice,
  bookerName,
  bookerPhone,
}: ApprovalNotificationParams) {
  const token = process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID || process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('[WhatsApp API] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_ID in environment variables.');
    throw new Error('WhatsApp API credentials are not configured.');
  }

  // Format recipient's phone number: must have country code, no +, no spaces
  // Default to +91 (India) if it's 10 digits and doesn't start with country code
  let cleanNumber = bookerPhone.replace(/[\s\-\(\)\+]/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber; // Prepend India country code by default
  }

  const seatsText = Array.isArray(seats) ? seats.join(', ') : (seats || 'N/A');
  const messageBody = `Hello ${bookerName || 'Customer'},

🎉 Your booking for the event has been APPROVED!

Booking Details:
----------------------------------
Booking ID: ${bookingId}
Event Name: ${eventName}
Seats: ${seatsText}
Date: ${date}
Time: ${time}
Venue: ${venue}
Total Paid: INR ${totalPrice}
----------------------------------

Your tickets are now confirmed. Please keep this message handy for entry verification at the venue.

Thank you for your payment!`;

  console.log(`[WhatsApp API] Dispatching approval notification to: ${cleanNumber}`);

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
    console.error(`[WhatsApp API Error] Status: ${response.status}`, responseData);
    throw new Error(responseData.error?.message || 'Failed to send WhatsApp message via Meta API');
  }

  console.log(`[WhatsApp API Success] Message sent successfully:`, responseData);
  return responseData;
}

