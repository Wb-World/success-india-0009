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
  const metaToken = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!metaToken || !phoneNumberId) {
    console.error('META_WHATSAPP_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID is not configured in environment variables.');
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
