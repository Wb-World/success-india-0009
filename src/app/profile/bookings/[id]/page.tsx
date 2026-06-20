'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Ticket, User, Phone, CreditCard, Hash, Clock, Download, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

// Status Label Helper
function getStatusLabel(status: string) {
  if (status === 'approved') return 'Confirmed';
  if (status === 'denied') return 'Rejected';
  return 'Pending Approval';
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    approved: { label: 'Verified Ticket', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', Icon: CheckCircle },
    pending:  { label: 'Pending Approval', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', Icon: Clock },
    denied:   { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
  }[status] ?? { label: 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', Icon: AlertTriangle };

  const { label, color, bg, border, Icon } = cfg;

  return (
    <span className="status-badge" style={{ background: bg, border: `1.5px solid ${border}`, color }}>
      <Icon size={14} />
      {label}
    </span>
  );
}

// Info Row Component
function TicketInfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="ticket-info-row">
      <div className="ticket-info-icon"><Icon size={16} /></div>
      <div className="ticket-info-text">
        <span className="ticket-info-label">{label}</span>
        <span className="ticket-info-value">{value}</span>
      </div>
    </div>
  );
}

// QR Code Generator
async function generateQRDataURL(text: string): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text, {
      width: 200,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch (err) {
    console.error('Failed to generate QR:', err);
    return '';
  }
}

function BookingDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState<any>(null);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Auth Guard
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/profile');
      return;
    }

    if (!bookingId) {
      setError('Invalid booking reference.');
      setLoading(false);
      return;
    }

    // Fetch booking details using our secure verify endpoint
    fetch(`/api/verify?id=${encodeURIComponent(bookingId)}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error('Ticket not found.');
        }
        return r.json();
      })
      .then((data) => {
        if (data && data.ticket) {
          setTicketData(data.ticket);
          
          // Generate QR code encoding the verification link
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const verifyUrl = `${origin}/verify?id=${encodeURIComponent(bookingId)}`;
          generateQRDataURL(verifyUrl).then(setQrUrl);
        } else {
          setError('Failed to load booking details.');
        }
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError(err.message || 'Verification service temporarily unavailable.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingId, router]);

  const handleDownload = async () => {
    if (!ticketData) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('booking-ticket-card');
      if (el) {
        // Adjust style parameters briefly for canvas export
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });
        const link = document.createElement('a');
        link.download = `Ticket-${bookingId.toUpperCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error('Download ticket failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="ticket-page-state">
        <Loader2 size={44} className="spin-animate" />
        <p>Retrieving your ticket details...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="ticket-page-state error">
        <AlertTriangle size={48} />
        <h2>Ticket Retrieval Failed</h2>
        <p>{error || 'This ticket could not be found or has expired.'}</p>
        <button className="btn btn-primary back-btn" onClick={() => router.push('/profile')}>
          <ArrowLeft size={16} /> Return to Profile
        </button>
      </div>
    );
  }

  const attendeeEntries = ticketData.attendees ? Object.entries(ticketData.attendees) : [];

  return (
    <div className="ticket-page-container">
      {/* Back button */}
      <div className="back-nav-row">
        <button className="back-link-btn" onClick={() => router.push('/profile')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Main Ticket Layout */}
      <div className="ticket-card-wrapper">
        <div id="booking-ticket-card" className={`booking-ticket-card status-${ticketData.status}`}>
          {/* Header Accent Bar */}
          <div className="ticket-accent-bar" />

          {/* Ticket Header Banner */}
          <div className="ticket-header-banner">
            <div className="ticket-brand-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/success-india-logo.jpeg" alt="Success Team Logo" className="ticket-brand-logo" />
              <div>
                <p className="ticket-brand-name">SUCCESS TEAM</p>
                <p className="ticket-brand-tag">Official Event Delegate Pass</p>
              </div>
            </div>
            <StatusBadge status={ticketData.status} />
          </div>

          {/* Perforation design */}
          <div className="ticket-perforation">
            <div className="ticket-hole left" />
            <div className="ticket-dash-line" />
            <div className="ticket-hole right" />
          </div>

          {/* Ticket Body Layout */}
          <div className="ticket-body-content">
            <div className="ticket-details-col">
              <h1 className="ticket-event-name">{ticketData.eventName}</h1>
              <p className="ticket-event-session">{ticketData.session}</p>

              <div className="ticket-info-grid">
                <TicketInfoRow icon={Hash} label="Booking Reference ID" value={`#${ticketData.bookingId?.toUpperCase()}`} />
                <TicketInfoRow icon={User} label="Primary Attendee Name" value={ticketData.attendeeName} />
                <TicketInfoRow icon={Phone} label="Phone Number" value={ticketData.bookerPhone} />
                <TicketInfoRow icon={MapPin} label="Venue Location" value={ticketData.venue} />
                <TicketInfoRow icon={Calendar} label="Session Date" value={ticketData.date} />
                <TicketInfoRow icon={Clock} label="Session Time" value={ticketData.time} />
                <TicketInfoRow icon={Ticket} label="Reserved Seats" value={ticketData.seats?.join(', ') || '—'} />
                <TicketInfoRow icon={CreditCard} label="Amount Paid" value={ticketData.amountPaid} />
              </div>

              {/* Payment row */}
              <div className="ticket-payment-status">
                <CreditCard size={14} />
                <span>Payment Status:</span>
                <strong className={`payment-${ticketData.status}`}>{ticketData.paymentStatus}</strong>
              </div>

              {/* Attendees section */}
              {attendeeEntries.length > 0 && (
                <div className="ticket-attendees-box">
                  <p className="ticket-attendees-title">Attendee Roster</p>
                  <div className="ticket-attendees-list">
                    {attendeeEntries.map(([seat, val]: any) => {
                      const name = typeof val === 'object' && val !== null ? val.name : val;
                      const phone = typeof val === 'object' && val !== null ? val.phone : '';
                      return (
                        <div key={seat} className="ticket-attendee-row">
                          <span className="ticket-seat-lbl">{seat}</span>
                          <span className="ticket-name-val">{name}</span>
                          {phone && <span className="ticket-phone-val">{phone}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Col */}
            <div className="ticket-qr-col">
              <div className="ticket-qr-container">
                <p className="qr-title-lbl">Verification Pass</p>
                {qrUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrUrl} alt="Verification QR Code" className="ticket-qr-img" />
                ) : (
                  <div className="qr-placeholder-spin"><Loader2 size={32} className="spin-animate" /></div>
                )}
                <p className="qr-ref-code">#{ticketData.bookingId?.slice(0, 8).toUpperCase()}</p>
                <span className="qr-instructions">Scan at entry to check-in</span>
              </div>
            </div>
          </div>

          {/* Banner Image Footer */}
          <div className="ticket-banner-footer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero-leader.jpg" alt="Event Banner Footer" className="ticket-footer-img" />
            <div className="ticket-footer-overlay">
              <span>Thank you for partnering with the Success Team program</span>
            </div>
          </div>
        </div>

        {/* Download Ticket Trigger */}
        <div className="ticket-download-wrap">
          <button 
            className="btn btn-primary ticket-download-btn" 
            onClick={handleDownload}
            disabled={downloading || !qrUrl}
          >
            <Download size={18} />
            {downloading ? 'Generating ticket file...' : 'Download Ticket (Image)'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .ticket-page-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 5rem;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .back-nav-row {
          margin-bottom: 1.5rem;
        }
        .back-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--muted);
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .back-link-btn:hover {
          color: var(--primary-dark);
        }

        /* ── Page state displays ── */
        .ticket-page-state {
          min-height: 50vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 3rem 1.5rem;
        }
        .ticket-page-state.error {
          color: #dc2626;
        }
        .ticket-page-state.error h2 {
          color: #1e293b;
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0;
        }
        .ticket-page-state.error p {
          color: #64748b;
          margin: 0 0 1rem;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.5rem;
          font-weight: 700;
        }

        .spin-animate {
          animation: spin 1s linear infinite;
          color: #10b981;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Ticket Container ── */
        .ticket-card-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .booking-ticket-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(15, 23, 42, 0.08), 0 5px 15px rgba(15, 23, 42, 0.04);
          border: 1px solid #e2e8f0;
          position: relative;
        }

        .ticket-accent-bar {
          height: 6px;
          background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%);
        }

        .ticket-header-banner {
          padding: 1.75rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          background: #fafafa;
        }
        .ticket-brand-row {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .ticket-brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          border: 1.5px solid #e2e8f0;
        }
        .ticket-brand-name {
          font-weight: 900;
          font-size: 1.1rem;
          color: #0f172a;
          margin: 0;
          letter-spacing: 0.04em;
        }
        .ticket-brand-tag {
          font-size: 0.76rem;
          color: #64748b;
          margin: 0;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* ── Perforation divider ── */
        .ticket-perforation {
          display: flex;
          align-items: center;
          position: relative;
          padding: 0;
        }
        .ticket-hole {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .ticket-hole.left { margin-left: -12px; }
        .ticket-hole.right { margin-right: -12px; }
        .ticket-dash-line {
          flex: 1;
          height: 0;
          border-top: 2px dashed #cbd5e1;
          margin: 0 6px;
        }

        /* ── Ticket Body ── */
        .ticket-body-content {
          padding: 2.25rem 2rem;
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 2.5rem;
        }

        .ticket-event-name {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.25rem;
          line-height: 1.25;
        }
        .ticket-event-session {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0 0 1.75rem;
          font-weight: 500;
        }

        .ticket-info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem 1.75rem;
          margin-bottom: 1.5rem;
        }

        .ticket-info-row {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .ticket-info-icon {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .ticket-info-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }
        .ticket-info-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .ticket-info-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          word-break: break-word;
        }

        /* ── Payment status bar ── */
        .ticket-payment-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.5rem 0.85rem;
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 1.5rem;
        }
        .ticket-payment-status strong {
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.02em;
        }
        .ticket-payment-status strong.payment-approved { color: #059669; }
        .ticket-payment-status strong.payment-pending { color: #d97706; }
        .ticket-payment-status strong.payment-denied { color: #dc2626; }

        /* ── Attendees section ── */
        .ticket-attendees-box {
          background: #f0fdf4;
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 1rem 1.25rem;
        }
        .ticket-attendees-title {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #047857;
          margin: 0 0 0.75rem;
        }
        .ticket-attendees-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .ticket-attendee-row {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .ticket-seat-lbl {
          background: #10b981;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .ticket-name-val {
          font-size: 0.85rem;
          font-weight: 600;
          color: #111827;
        }
        .ticket-phone-val {
          font-size: 0.78rem;
          color: #4b5563;
        }

        /* ── QR Code Col ── */
        .ticket-qr-col {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          border-left: 2px dashed #f1f5f9;
          padding-left: 2.5rem;
        }
        .ticket-qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.65rem;
          width: 100%;
        }
        .qr-title-lbl {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
        }
        .ticket-qr-img {
          width: 160px;
          height: 160px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .qr-placeholder-spin {
          width: 160px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafafa;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        .qr-ref-code {
          font-family: monospace;
          font-size: 0.8rem;
          font-weight: 700;
          color: #334155;
          margin: 0;
        }
        .qr-instructions {
          font-size: 0.7rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* ── Event Banner Footer ── */
        .ticket-banner-footer {
          height: 100px;
          position: relative;
          overflow: hidden;
          background: #0f172a;
        }
        .ticket-footer-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.35;
        }
        .ticket-footer-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        /* ── Download trigger section ── */
        .ticket-download-wrap {
          display: flex;
          justify-content: center;
          margin-top: 1rem;
        }
        .ticket-download-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.85rem 2rem;
          font-size: 0.95rem;
          font-weight: 700;
          border-radius: 12px;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          border: none;
          box-shadow: 0 4px 6px rgba(15, 23, 42, 0.1);
          color: white;
          cursor: pointer;
          transition: transform 0.1s ease, opacity 0.15s ease;
        }
        .ticket-download-btn:hover {
          opacity: 0.93;
          transform: translateY(-1px);
        }
        .ticket-download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive Layouts */
        @media (max-width: 768px) {
          .ticket-body-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            padding: 1.75rem 1.5rem;
          }
          .ticket-qr-col {
            border-left: none;
            border-top: 2px dashed #f1f5f9;
            padding-left: 0;
            padding-top: 2rem;
          }
          .ticket-info-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .ticket-header-banner {
            padding: 1.25rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookingDetailsPage() {
  return (
    <Suspense fallback={
      <div className="ticket-page-state">
        <Loader2 size={44} className="spin-animate" />
        <p>Loading ticket info...</p>
      </div>
    }>
      <BookingDetailsContent />
    </Suspense>
  );
}
