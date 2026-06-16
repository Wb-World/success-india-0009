import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 1. Basic Server-side Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // 2. Read Resend API Key from Environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not configured.');
      return NextResponse.json(
        { error: 'Email subscription service is temporarily offline. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // 3. Premium Success Team Light Green & White HTML Email Body Template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Success Team</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0fdf4;
      margin: 0;
      padding: 0;
      color: #1f2937;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.08);
      border: 1px solid #dcfce7;
    }
    .header {
      background: linear-gradient(135deg, #16a34a, #15803d);
      padding: 30px 40px;
      text-align: center;
      color: #ffffff;
    }
    .logo-img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      vertical-align: middle;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header h1 span {
      color: #dcfce7;
    }
    .content {
      padding: 40px;
      line-height: 1.6;
    }
    .content h2 {
      font-size: 20px;
      color: #111827;
      margin-top: 0;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 20px;
      color: #4b5563;
      font-size: 16px;
    }
    .bullet-points {
      background-color: #f9fafb;
      border-left: 4px solid #16a34a;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .bullet-points ul {
      margin: 0;
      padding-left: 20px;
    }
    .bullet-points li {
      margin-bottom: 10px;
      color: #374151;
      font-size: 15px;
    }
    .bullet-points li:last-child {
      margin-bottom: 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #16a34a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #15803d;
    }
    .footer {
      padding: 30px 40px;
      background-color: #f9fafb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
    }
    .footer p {
      margin: 0 0 10px 0;
      line-height: 1.5;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/Wb-World/bus-ticket-booking-0009/main/public/success-india-logo.jpeg" alt="Success Team Logo" class="logo-img">
      <h1>Success <span>Team</span></h1>
    </div>
    <div class="content">
      <h2>Welcome to Success Team! ✨</h2>
      <p>Hello,</p>
      <p>Thank you for subscribing to the <strong>Success Team Official Event & Leadership Portal</strong> newsletter. We are thrilled to welcome you to our community of leaders and entrepreneurs!</p>
      <p>By subscribing, you will receive priority alerts and resources, including:</p>
      <div class="bullet-points">
        <ul>
          <li><strong>Priority Seat Booking</strong>: Early notice and booking access for weekly leadership and strategy sessions.</li>
          <li><strong>Local Chapter Meetups</strong>: Invitations to exclusive chapter briefings in Chromepet, Chennai, and other Tamil Nadu regions.</li>
          <li><strong>Income-Generation Systems</strong>: Access to training programs and direct-selling workshops.</li>
          <li><strong>Official Notices & Resource Material</strong>: Direct access to learning guides and updates.</li>
        </ul>
      </div>
      <p>To view upcoming events and manage your seminar reservations, explore our portal page today:</p>
      <p style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
        <a href="https://accsysindia.com/book" class="cta-button" target="_blank">Explore Seminars Now</a>
      </p>
      <p>Warm regards,<br><strong>Success Team</strong></p>
    </div>
    <div class="footer">
      <p>No 303, 2nd floor, Grand Southern Trunk Rd, Chromepet, Chennai, Tamil Nadu 600044</p>
      <p>&copy; 2026 Success Team. All rights reserved.</p>
      <p>If you wish to stop receiving these updates, you can <a href="mailto:accsysindia.com?subject=Unsubscribe">unsubscribe here</a>.</p>
    </div>
  </div>
</body>
</html>
    `;

    // 4. Send the email using direct fetch to the Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Success Team <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Success Team - Official Event & Leadership Portal ✨',
        html: htmlContent,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error response:', resendData);
      return NextResponse.json(
        { error: resendData.message || 'Failed to send welcome email.' },
        { status: resendResponse.status }
      );
    }

    return NextResponse.json({ success: true, data: resendData });
  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
